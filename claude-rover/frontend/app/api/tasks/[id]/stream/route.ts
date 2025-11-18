/**
 * Server-Sent Events (SSE) endpoint for real-time task updates
 *
 * This endpoint provides a streaming connection that pushes task status updates
 * to clients in real-time using Server-Sent Events.
 *
 * Features:
 * - Real-time task status updates via SSE
 * - Heartbeat messages every 30 seconds to keep connection alive
 * - Automatic cleanup on client disconnect
 * - File system watching using FileWatcher service
 * - Type-safe event handling
 *
 * @endpoint GET /api/tasks/:id/stream
 *
 * @example
 * // Client usage:
 * const eventSource = new EventSource('/api/tasks/123/stream');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Task update:', data);
 * };
 */

import { NextRequest } from 'next/server';
import { getFileWatcher, type WatchEvent } from '@/lib/api/file-watcher';

/**
 * GET /api/tasks/:id/stream
 *
 * Establishes a Server-Sent Events connection for real-time task updates
 *
 * @param request - Next.js request object (used for abort signal)
 * @param params - Route parameters containing task ID
 * @returns Response with text/event-stream content type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 16+
  const { id } = await params;

  // Parse and validate task ID
  const taskId = parseInt(id, 10);

  if (isNaN(taskId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid task ID' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.log(`[SSE] Client connected for task ${taskId}`);

  // Get the FileWatcher singleton instance
  const watcher = getFileWatcher();

  // Create a text encoder for converting strings to Uint8Array
  const encoder = new TextEncoder();

  // Create the readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send an initial connection message
      const connectionMessage = `data: ${JSON.stringify({
        type: 'connected',
        taskId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectionMessage));

      // Set up heartbeat to keep connection alive
      // SSE connections can timeout if no data is sent
      const heartbeat = setInterval(() => {
        try {
          // SSE comment format (lines starting with ':' are comments/heartbeats)
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
          console.log(`[SSE] Heartbeat sent for task ${taskId}`);
        } catch (error) {
          console.error(`[SSE] Error sending heartbeat for task ${taskId}:`, error);
          clearInterval(heartbeat);
        }
      }, 30000); // 30 seconds

      // Event handler for file changes
      const handler = (event: WatchEvent) => {
        // Only send events for this specific task
        if (event.taskId === taskId) {
          try {
            // Format as SSE data event
            // SSE format: "data: <json>\n\n"
            const data = `data: ${JSON.stringify({
              type: 'update',
              taskId: event.taskId,
              iteration: event.iteration,
              data: event.data,
              timestamp: event.timestamp,
            })}\n\n`;

            controller.enqueue(encoder.encode(data));

            console.log(`[SSE] Update sent for task ${taskId}:`, {
              iteration: event.iteration,
              status: event.data?.status,
              progress: event.data?.progress,
            });
          } catch (error) {
            console.error(`[SSE] Error sending update for task ${taskId}:`, error);
          }
        }
      };

      // Register the event handler
      watcher.on('change', handler);

      // Handle client disconnect
      // This is triggered when the client closes the EventSource or navigates away
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Client disconnected for task ${taskId}`);

        // Clean up resources
        clearInterval(heartbeat);
        watcher.off('change', handler);

        // Close the stream
        try {
          controller.close();
        } catch (error) {
          // Controller may already be closed
          console.error(`[SSE] Error closing controller for task ${taskId}:`, error);
        }
      });

      // Handle watcher errors
      const errorHandler = (error: Error) => {
        console.error(`[SSE] FileWatcher error for task ${taskId}:`, error);

        try {
          // Send error event to client
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            taskId,
            error: error.message,
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(encoder.encode(errorData));
        } catch (sendError) {
          console.error(`[SSE] Error sending error event for task ${taskId}:`, sendError);
        }
      };

      watcher.on('error', errorHandler);

      // Clean up error handler on disconnect
      request.signal.addEventListener('abort', () => {
        watcher.off('error', errorHandler);
      });
    },
  });

  // Return the SSE response with appropriate headers
  return new Response(stream, {
    headers: {
      // Required SSE headers
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',

      // Recommended headers for better compatibility
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*', // Allow CORS (adjust for production)
    },
  });
}

/**
 * OPTIONS /api/tasks/:id/stream
 *
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
