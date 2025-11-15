/**
 * DiffViewer Component
 *
 * Displays git diffs with:
 * - Split/unified view toggle
 * - Syntax highlighting
 * - File tree navigation
 * - Expand/collapse hunks
 * - Search in diff
 * - Line numbers
 * - Copy to clipboard
 *
 * Uses react-diff-view for rendering diffs.
 */

"use client"

import * as React from "react"
import { parseDiff, Diff, Hunk, Decoration } from "react-diff-view"
// Type imports not available in current version of react-diff-view
type DiffFile = any;
type DiffHunk = any;
import {
  Split,
  Columns,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  X,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileTree, type FileStats } from "./FileTree"
import { cn } from "@/lib/utils"
import "react-diff-view/style/index.css"

export interface DiffViewerProps {
  /** Raw unified diff string */
  diff: string
  /** List of changed files */
  files: string[]
  /** Diff statistics */
  stats: {
    filesChanged: number
    insertions: number
    deletions: number
  }
  /** Additional CSS classes */
  className?: string
}

type ViewType = "split" | "unified"

/**
 * Extract file-level statistics from parsed diff files
 */
function extractFileStats(parsedFiles: DiffFile[]): Record<string, FileStats> {
  const stats: Record<string, FileStats> = {}

  for (const file of parsedFiles) {
    let additions = 0
    let deletions = 0

    for (const hunk of file.hunks) {
      for (const change of hunk.changes) {
        if (change.type === "insert") {
          additions++
        } else if (change.type === "delete") {
          deletions++
        }
      }
    }

    // Use newPath for new files, oldPath for deleted files
    const path = file.newPath || file.oldPath
    if (path) {
      stats[path] = { additions, deletions }
    }
  }

  return stats
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error("Failed to copy to clipboard:", error)
    return false
  }
}

/**
 * Hunk header component with expand/collapse functionality
 */
interface HunkHeaderProps {
  hunk: DiffHunk
  isExpanded: boolean
  onToggle: () => void
}

function HunkHeader({ hunk, isExpanded, onToggle }: HunkHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-600 dark:text-zinc-400 transition-colors"
    >
      {isExpanded ? (
        <ChevronDown className="h-3 w-3 shrink-0" />
      ) : (
        <ChevronRight className="h-3 w-3 shrink-0" />
      )}
      <span>{hunk.content}</span>
    </button>
  )
}

/**
 * Custom widgets for hunks
 */
const widgets = {
  hunk: HunkHeader,
}

/**
 * DiffViewer Component
 */
export function DiffViewer({ diff, files, stats, className }: DiffViewerProps) {
  const [viewType, setViewType] = React.useState<ViewType>("unified")
  const [selectedFile, setSelectedFile] = React.useState<string | undefined>(
    files[0]
  )
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showSearch, setShowSearch] = React.useState(false)
  const [copiedFile, setCopiedFile] = React.useState<string | null>(null)
  const [collapsedHunks, setCollapsedHunks] = React.useState<Set<string>>(new Set())

  // Parse the diff
  const parsedFiles = React.useMemo(() => {
    try {
      return parseDiff(diff)
    } catch (error) {
      console.error("Failed to parse diff:", error)
      return []
    }
  }, [diff])

  // Extract file statistics
  const fileStats = React.useMemo(() => extractFileStats(parsedFiles), [parsedFiles])

  // Get the currently selected file's diff
  const currentFile = React.useMemo(() => {
    if (!selectedFile) return null
    return parsedFiles.find(
      (f) => f.newPath === selectedFile || f.oldPath === selectedFile
    )
  }, [parsedFiles, selectedFile])

  // Filter hunks based on search query
  const filteredHunks = React.useMemo(() => {
    if (!currentFile || !searchQuery) {
      return currentFile?.hunks || []
    }

    const query = searchQuery.toLowerCase()
    return currentFile.hunks.filter((hunk) =>
      hunk.changes.some((change) => change.content.toLowerCase().includes(query))
    )
  }, [currentFile, searchQuery])

  // Handle file selection
  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath)
    setSearchQuery("")
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!currentFile) return

    // Get the diff for the current file
    const fileDiff = diff
      .split(/^diff --git /m)
      .find((section) => section.includes(currentFile.newPath || currentFile.oldPath || ""))

    if (fileDiff) {
      const success = await copyToClipboard(`diff --git ${fileDiff}`)
      if (success) {
        setCopiedFile(selectedFile || null)
        setTimeout(() => setCopiedFile(null), 2000)
      }
    }
  }

  // Toggle hunk expansion
  const toggleHunk = (hunkIndex: number) => {
    const key = `${selectedFile}-${hunkIndex}`
    setCollapsedHunks((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Handle search toggle
  const handleSearchToggle = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchQuery("")
    }
  }

  if (!diff || parsedFiles.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center space-y-2">
          <FileText className="h-12 w-12 mx-auto text-zinc-400" />
          <p className="text-sm text-zinc-500">No changes to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            {stats.filesChanged} {stats.filesChanged === 1 ? "file" : "files"} changed
          </span>
          <span className="text-green-600 dark:text-green-400">
            +{stats.insertions}
          </span>
          <span className="text-red-600 dark:text-red-400">
            -{stats.deletions}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearchToggle}
            title="Search in diff"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Copy to clipboard */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            disabled={!currentFile}
            title="Copy diff to clipboard"
          >
            {copiedFile === selectedFile ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>

          {/* View type toggle */}
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
            <TabsList>
              <TabsTrigger value="unified" title="Unified view">
                <Split className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="split" title="Split view">
                <Columns className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 p-2 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search in diff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearchToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
          <FileTree
            files={files}
            fileStats={fileStats}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Diff view */}
        <div className="flex-1 overflow-auto">
          {currentFile ? (
            <div className="min-w-max">
              {/* File header */}
              <div className="sticky top-0 z-10 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <div className="font-mono text-sm">
                  {currentFile.type === "delete" && (
                    <span className="text-red-600 dark:text-red-400">
                      {currentFile.oldPath}
                    </span>
                  )}
                  {currentFile.type === "add" && (
                    <span className="text-green-600 dark:text-green-400">
                      {currentFile.newPath}
                    </span>
                  )}
                  {currentFile.type === "rename" && (
                    <span>
                      <span className="text-red-600 dark:text-red-400">
                        {currentFile.oldPath}
                      </span>
                      {" → "}
                      <span className="text-green-600 dark:text-green-400">
                        {currentFile.newPath}
                      </span>
                    </span>
                  )}
                  {currentFile.type === "modify" && (
                    <span>{currentFile.newPath}</span>
                  )}
                </div>
              </div>

              {/* Diff content */}
              <div className="diff-viewer-content">
                {filteredHunks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-zinc-500">
                    {searchQuery
                      ? "No matches found"
                      : "No changes in this file"}
                  </div>
                ) : (
                  <Diff
                    viewType={viewType}
                    diffType={currentFile.type}
                    hunks={filteredHunks}
                  >
                    {(hunks) =>
                      hunks.map((hunk, hunkIndex) => {
                        const key = `${selectedFile}-${hunkIndex}`
                        const isExpanded = !collapsedHunks.has(key)

                        return (
                          <div key={hunk.content}>
                            <HunkHeader
                              hunk={hunk}
                              isExpanded={isExpanded}
                              onToggle={() => toggleHunk(hunkIndex)}
                            />
                            {isExpanded && <Hunk key={hunk.content} hunk={hunk} />}
                          </div>
                        )
                      })
                    }
                  </Diff>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-zinc-500">Select a file to view diff</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
