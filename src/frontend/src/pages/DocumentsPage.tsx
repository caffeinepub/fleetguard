import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  FolderOpen,
  Loader2,
  Pencil,
  Printer,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Vehicle } from "../backend";
import { useActor } from "../hooks/useActor";

// ---------------------------------------------------------------------------
// Local document storage (per company — keyed by company id)
// ---------------------------------------------------------------------------
export interface LocalDocument {
  id: string;
  fileName: string;
  displayName?: string;
  fileType: string;
  fileSize: number;
  vehicleId: string | null;
  uploadedAt: number; // epoch ms
  uploadedBy: string;
  dataUrl: string; // base64 data URL stored in localStorage
}

const getStorageKey = (companyId: string) => `fleetguard_docs_${companyId}`;

function loadDocs(companyId: string): LocalDocument[] {
  try {
    const raw = localStorage.getItem(getStorageKey(companyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocs(companyId: string, docs: LocalDocument[]) {
  try {
    localStorage.setItem(getStorageKey(companyId), JSON.stringify(docs));
  } catch {
    toast.error("Storage limit reached. Try deleting older documents.");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")
    return <FileType2 size={20} className="text-red-500 flex-shrink-0" />;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return <FileImage size={20} className="text-blue-500 flex-shrink-0" />;
  if (["xls", "xlsx", "csv"].includes(ext))
    return (
      <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
    );
  return <FileText size={20} className="text-muted-foreground flex-shrink-0" />;
}

function getFileBadgeColor(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (["xls", "xlsx", "csv"].includes(ext))
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  return "bg-muted text-muted-foreground";
}

function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
}

function isPdfFile(fileName: string): boolean {
  return fileName.split(".").pop()?.toLowerCase() === "pdf";
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function DocumentsPage() {
  const { actor } = useActor();

  // Fetch vehicles for filter
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVehicles();
    },
    enabled: !!actor,
  });

  // company id (used as storage namespace)
  const [companyId, setCompanyId] = useState<string>("default");
  useEffect(() => {
    if (!actor) return;
    actor
      .getCallerCompanyId()
      .then((id) => {
        if (id) setCompanyId(id);
      })
      .catch(() => {});
  }, [actor]);

  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load docs when companyId resolves
  useEffect(() => {
    const docs = loadDocs(companyId);
    setDocuments(docs);
    setLoaded(true);
  }, [companyId]);

  // Filters
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploadVehicleId, setUploadVehicleId] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview dialog
  const [previewDoc, setPreviewDoc] = useState<LocalDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Selection for print
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Rename
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Filtered list
  const filtered = documents.filter((doc) => {
    const displayName = doc.displayName ?? doc.fileName;
    const matchSearch = displayName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchVehicle =
      vehicleFilter === "all" ||
      (vehicleFilter === "none" && doc.vehicleId === null) ||
      doc.vehicleId === vehicleFilter;
    return matchSearch && matchVehicle;
  });

  const getVehicleName = (vehicleId: string | null): string => {
    if (!vehicleId) return "General";
    const v = (vehicles ?? []).find((v) => v.id.toString() === vehicleId);
    return v ? `${v.name} (${v.licensePlate})` : "Unknown Asset";
  };

  // -------------------------------------------------------------------------
  // Upload
  // -------------------------------------------------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadFile(file);
  };

  const resetUploadModal = () => {
    setUploadFile(null);
    setUploadDocName("");
    setUploadVehicleId("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }
    if (uploadFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10 MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read file as data URL with progress tracking
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 80));
          }
        };
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });

      setUploadProgress(90);

      const callerName =
        (await actor
          ?.getCallerUserProfile()
          .then((p) => p?.name ?? "Unknown")
          .catch(() => "Unknown")) ?? "Unknown";

      const newDoc: LocalDocument = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName: uploadFile.name,
        displayName: uploadDocName.trim() || uploadFile.name,
        fileType:
          uploadFile.type || uploadFile.name.split(".").pop() || "unknown",
        fileSize: uploadFile.size,
        vehicleId:
          uploadVehicleId && uploadVehicleId !== "none"
            ? uploadVehicleId
            : null,
        uploadedAt: Date.now(),
        uploadedBy: callerName,
        dataUrl,
      };

      const updated = [newDoc, ...documents];
      setDocuments(updated);
      saveDocs(companyId, updated);

      setUploadProgress(100);
      toast.success(`"${newDoc.displayName}" uploaded successfully`);

      // Reset modal state
      setUploadOpen(false);
      resetUploadModal();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    saveDocs(companyId, updated);
    setDeleteId(null);
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
    toast.success("Document deleted");
  };

  // -------------------------------------------------------------------------
  // Rename
  // -------------------------------------------------------------------------
  const handleRename = () => {
    if (!renameId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      toast.error("Document name cannot be empty");
      return;
    }
    const updated = documents.map((d) =>
      d.id === renameId ? { ...d, displayName: trimmed } : d,
    );
    setDocuments(updated);
    saveDocs(companyId, updated);
    setRenameId(null);
    setRenameValue("");
    toast.success("Document renamed");
  };

  // -------------------------------------------------------------------------
  // View / Download
  // -------------------------------------------------------------------------
  const handleView = (doc: LocalDocument) => {
    const link = document.createElement("a");
    link.href = doc.dataUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const viewable = ["pdf", "png", "jpg", "jpeg", "gif", "webp"].includes(
      doc.fileName.split(".").pop()?.toLowerCase() ?? "",
    );
    if (!viewable) {
      link.download = doc.fileName;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = (doc: LocalDocument) => {
    const link = document.createElement("a");
    link.href = doc.dataUrl;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  };

  // -------------------------------------------------------------------------
  // Print selected
  // -------------------------------------------------------------------------
  const handlePrintSelected = () => {
    const selected = documents.filter((d) => selectedIds.has(d.id));
    if (selected.length === 0) {
      toast.error("No documents selected");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Could not open print window. Check pop-up blocker.");
      return;
    }

    const rows = selected
      .map(
        (d, i) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500">${d.displayName ?? d.fileName}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${d.fileType}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${getVehicleName(d.vehicleId)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${formatDate(d.uploadedAt)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${formatFileSize(d.fileSize)}</td>
          </tr>`,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FleetGuard \u2014 Selected Documents</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { color: #666; font-size: 13px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
            tr:last-child td { border-bottom: none; }
          </style>
        </head>
        <body>
          <h1>FleetGuard \u2014 Document List</h1>
          <p>Printed on ${new Date().toLocaleString()} \u00b7 ${selected.length} document${selected.length !== 1 ? "s" : ""} selected</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Document Name</th>
                <th>Type</th>
                <th>Asset / Vehicle</th>
                <th>Upload Date</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const isLoading = !loaded || vehiclesLoading;

  return (
    <div className="p-6 space-y-5 animate-fade-in" data-ocid="documents.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
            stored
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              data-ocid="documents.secondary_button"
              onClick={handlePrintSelected}
            >
              <Printer size={15} />
              Print Selected ({selectedIds.size})
            </Button>
          )}
          <Button
            data-ocid="documents.upload_button"
            className="gap-2"
            onClick={() => setUploadOpen(true)}
          >
            <Upload size={15} /> Upload Document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="documents.search_input"
            className="pl-9"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-56" data-ocid="documents.select">
            <SelectValue placeholder="All Assets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            <SelectItem value="none">General (No Asset)</SelectItem>
            {(vehicles ?? []).map((v) => (
              <SelectItem key={v.id.toString()} value={v.id.toString()}>
                {v.name} ({v.licensePlate})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="documents.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="documents.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {search || vehicleFilter !== "all"
              ? "No documents match your filters"
              : "No documents yet"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {search || vehicleFilter !== "all"
              ? "Try adjusting your search or filter."
              : "Upload PDFs, images, manuals, warranties, and invoices related to your fleet assets."}
          </p>
          {!search && vehicleFilter === "all" && (
            <Button
              className="mt-5 gap-2"
              data-ocid="documents.primary_button"
              onClick={() => setUploadOpen(true)}
            >
              <Upload size={15} /> Upload Your First Document
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Table header with select-all */}
          <div className="bg-muted/40 border-b border-border px-5 py-3 flex items-center gap-3">
            <input
              type="checkbox"
              className="accent-primary w-4 h-4 cursor-pointer"
              checked={
                selectedIds.size === filtered.length && filtered.length > 0
              }
              onChange={toggleSelectAll}
              title="Select all"
              data-ocid="documents.checkbox"
            />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
              Document Name
            </span>
            <span className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wide w-40">
              Asset / Vehicle
            </span>
            <span className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
              Uploaded
            </span>
            <span className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20">
              Size
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32 text-right">
              Actions
            </span>
          </div>
          <div className="divide-y divide-border/50" data-ocid="documents.list">
            {filtered.map((doc, i) => (
              <div
                key={doc.id}
                data-ocid={`documents.item.${i + 1}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4 cursor-pointer flex-shrink-0"
                  checked={selectedIds.has(doc.id)}
                  onChange={() => toggleSelect(doc.id)}
                  data-ocid={`documents.checkbox.${i + 1}`}
                />
                {/* File icon + name */}
                <button
                  type="button"
                  className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                  onClick={() => {
                    setPreviewDoc(doc);
                    setPreviewOpen(true);
                  }}
                  title={`Preview ${doc.displayName ?? doc.fileName}`}
                >
                  {getFileIcon(doc.fileName)}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {doc.displayName ?? doc.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${getFileBadgeColor(doc.fileName)}`}
                      >
                        {doc.fileName.split(".").pop()?.toUpperCase() ?? "FILE"}
                      </span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {getVehicleName(doc.vehicleId)}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Asset */}
                <div className="hidden md:block w-40 min-w-0">
                  <span className="text-sm text-muted-foreground truncate block">
                    {getVehicleName(doc.vehicleId)}
                  </span>
                </div>

                {/* Date */}
                <div className="hidden lg:block w-28">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(doc.uploadedAt)}
                  </span>
                </div>

                {/* Size */}
                <div className="hidden lg:block w-20">
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(doc.fileSize)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 w-32 justify-end flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    title="Rename"
                    data-ocid={`documents.edit_button.${i + 1}`}
                    onClick={() => {
                      setRenameId(doc.id);
                      setRenameValue(doc.displayName ?? doc.fileName);
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    title="Download"
                    data-ocid={`documents.secondary_button.${i + 1}`}
                    onClick={() => handleDownload(doc)}
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Delete"
                    data-ocid={`documents.delete_button.${i + 1}`}
                    onClick={() => setDeleteId(doc.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(o) => {
          if (!isUploading) {
            setUploadOpen(o);
            if (!o) resetUploadModal();
          }
        }}
      >
        <DialogContent className="max-w-md" data-ocid="documents.dialog">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Document name */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-name">Document Name</Label>
              <Input
                id="doc-name"
                placeholder={
                  uploadFile
                    ? uploadFile.name
                    : "e.g. Engine Service Manual 2024"
                }
                value={uploadDocName}
                onChange={(e) => setUploadDocName(e.target.value)}
                data-ocid="documents.input"
              />
              <p className="text-xs text-muted-foreground">
                Optional. If left blank, the file name will be used.
              </p>
            </div>

            {/* File input */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-file">File *</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) =>
                  e.key === "Enter" && fileInputRef.current?.click()
                }
                data-ocid="documents.dropzone"
              >
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-3">
                    {getFileIcon(uploadFile.name)}
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {uploadFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.size)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload
                      size={24}
                      className="mx-auto text-muted-foreground"
                    />
                    <p className="text-sm text-muted-foreground">
                      Click to select a file
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, images, Word, Excel, text files \u2014 max 10 MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="doc-file"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={handleFileSelect}
                data-ocid="documents.upload_button"
              />
            </div>

            {/* Vehicle selector */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-vehicle">Associated Asset / Vehicle</Label>
              <Select
                value={uploadVehicleId || "none"}
                onValueChange={setUploadVehicleId}
              >
                <SelectTrigger id="doc-vehicle" data-ocid="documents.select">
                  <SelectValue placeholder="No specific asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    No specific asset (General)
                  </SelectItem>
                  {(vehicles ?? []).map((v) => (
                    <SelectItem key={v.id.toString()} value={v.id.toString()}>
                      {v.name} ({v.licensePlate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload progress */}
            {isUploading && (
              <div className="space-y-1.5" data-ocid="documents.loading_state">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                resetUploadModal();
              }}
              disabled={isUploading}
              data-ocid="documents.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
              data-ocid="documents.submit_button"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onOpenChange={(o) => {
          setPreviewOpen(o);
          if (!o) setPreviewDoc(null);
        }}
      >
        <DialogContent className="max-w-3xl" data-ocid="documents.modal">
          <DialogHeader>
            <DialogTitle className="truncate pr-4">
              {previewDoc
                ? (previewDoc.displayName ?? previewDoc.fileName)
                : ""}
            </DialogTitle>
          </DialogHeader>

          {previewDoc && (
            <div className="py-2">
              {isImageFile(previewDoc.fileName) ? (
                <div className="flex items-center justify-center bg-muted/30 rounded-lg p-2">
                  <img
                    src={previewDoc.dataUrl}
                    alt={previewDoc.displayName ?? previewDoc.fileName}
                    className="max-h-[70vh] w-auto object-contain rounded"
                  />
                </div>
              ) : isPdfFile(previewDoc.fileName) ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.displayName ?? previewDoc.fileName}
                  width="100%"
                  height="500px"
                  className="rounded border border-border"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    {getFileIcon(previewDoc.fileName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Preview not available for this file type
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {previewDoc.fileName.split(".").pop()?.toUpperCase() ??
                        "FILE"}{" "}
                      files cannot be previewed in the browser.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => previewDoc && handleDownload(previewDoc)}
                    data-ocid="documents.secondary_button"
                  >
                    <Download size={15} /> Download File
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {previewDoc &&
              (isImageFile(previewDoc.fileName) ||
                isPdfFile(previewDoc.fileName)) && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => previewDoc && handleView(previewDoc)}
                  data-ocid="documents.secondary_button"
                >
                  Open in Tab
                </Button>
              )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => previewDoc && handleDownload(previewDoc)}
              data-ocid="documents.secondary_button"
            >
              <Download size={15} /> Download
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                setPreviewDoc(null);
              }}
              data-ocid="documents.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm" data-ocid="documents.dialog">
          <DialogHeader>
            <DialogTitle>Delete Document?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently delete the document. This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              data-ocid="documents.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="documents.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={!!renameId}
        onOpenChange={(o) => {
          if (!o) {
            setRenameId(null);
            setRenameValue("");
          }
        }}
      >
        <DialogContent className="max-w-sm" data-ocid="documents.dialog">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              placeholder="Document name"
              autoFocus
              data-ocid="documents.input"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameId(null);
                setRenameValue("");
              }}
              data-ocid="documents.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameValue.trim()}
              data-ocid="documents.save_button"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
