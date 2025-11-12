/**
 * FileTree Component
 *
 * Displays a tree view of changed files in a diff with:
 * - File icons based on file type
 * - Folder hierarchy
 * - File statistics (additions/deletions)
 * - Selection highlighting
 * - Collapsible directories
 *
 * Used by DiffViewer for file navigation.
 */

"use client"

import * as React from "react"
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileJson,
  FileText,
  Image,
  Plus,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileStats {
  additions: number
  deletions: number
}

export interface FileNode {
  path: string
  name: string
  type: "file" | "directory"
  children?: FileNode[]
  stats?: FileStats
}

export interface FileTreeProps {
  /** List of file paths */
  files: string[]
  /** File statistics by path */
  fileStats?: Record<string, FileStats>
  /** Currently selected file */
  selectedFile?: string
  /** Callback when a file is selected */
  onFileSelect?: (filePath: string) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Build a tree structure from a list of file paths
 */
function buildFileTree(files: string[], fileStats?: Record<string, FileStats>): FileNode[] {
  const root: Record<string, FileNode> = {}

  for (const filePath of files) {
    const parts = filePath.split("/")
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      const fullPath = parts.slice(0, i + 1).join("/")

      if (!current[part]) {
        current[part] = {
          path: fullPath,
          name: part,
          type: isLast ? "file" : "directory",
          children: isLast ? undefined : {},
          stats: isLast && fileStats ? fileStats[filePath] : undefined,
        }
      }

      if (!isLast && current[part].children) {
        current = current[part].children as Record<string, FileNode>
      }
    }
  }

  // Convert object to array and sort (directories first, then files)
  function convertToArray(obj: Record<string, FileNode>): FileNode[] {
    const nodes = Object.values(obj)

    // Convert children objects to arrays recursively
    nodes.forEach(node => {
      if (node.children && typeof node.children === 'object') {
        node.children = convertToArray(node.children as Record<string, FileNode>)
      }
    })

    // Sort: directories first, then alphabetically
    return nodes.sort((a, b) => {
      if (a.type === "directory" && b.type === "file") return -1
      if (a.type === "file" && b.type === "directory") return 1
      return a.name.localeCompare(b.name)
    })
  }

  return convertToArray(root)
}

/**
 * Get the appropriate icon for a file based on its extension
 */
function getFileIcon(filename: string): React.ReactNode {
  const ext = filename.split(".").pop()?.toLowerCase()

  switch (ext) {
    case "json":
      return <FileJson className="h-4 w-4" />
    case "md":
    case "txt":
      return <FileText className="h-4 w-4" />
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
      return <Image className="h-4 w-4" />
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "py":
    case "go":
    case "rs":
    case "java":
    case "cpp":
    case "c":
    case "h":
    case "css":
    case "scss":
    case "html":
      return <FileCode className="h-4 w-4" />
    default:
      return <File className="h-4 w-4" />
  }
}

/**
 * TreeNode Component - Renders a single node (file or directory)
 */
interface TreeNodeProps {
  node: FileNode
  level: number
  selectedFile?: string
  onFileSelect?: (filePath: string) => void
}

function TreeNode({ node, level, selectedFile, onFileSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const isSelected = node.type === "file" && node.path === selectedFile
  const hasChildren = node.children && node.children.length > 0

  const handleClick = () => {
    if (node.type === "file") {
      onFileSelect?.(node.path)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors rounded-sm",
          isSelected && "bg-zinc-200 dark:bg-zinc-700",
          "text-left"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Chevron for directories */}
        {node.type === "directory" && (
          <span className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}

        {/* Icon */}
        <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
          {node.type === "directory" ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )
          ) : (
            getFileIcon(node.name)
          )}
        </span>

        {/* Name */}
        <span className="flex-1 truncate">{node.name}</span>

        {/* Stats for files */}
        {node.type === "file" && node.stats && (
          <span className="shrink-0 flex items-center gap-1 text-xs">
            {node.stats.additions > 0 && (
              <span className="flex items-center text-green-600 dark:text-green-400">
                <Plus className="h-3 w-3" />
                {node.stats.additions}
              </span>
            )}
            {node.stats.deletions > 0 && (
              <span className="flex items-center text-red-600 dark:text-red-400">
                <Minus className="h-3 w-3" />
                {node.stats.deletions}
              </span>
            )}
          </span>
        )}
      </button>

      {/* Children (if directory and expanded) */}
      {node.type === "directory" && hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * FileTree Component
 */
export function FileTree({
  files,
  fileStats,
  selectedFile,
  onFileSelect,
  className,
}: FileTreeProps) {
  const tree = React.useMemo(() => buildFileTree(files, fileStats), [files, fileStats])

  if (files.length === 0) {
    return (
      <div className={cn("p-4 text-center text-sm text-zinc-500", className)}>
        No files changed
      </div>
    )
  }

  return (
    <div className={cn("py-2", className)}>
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          level={0}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  )
}
