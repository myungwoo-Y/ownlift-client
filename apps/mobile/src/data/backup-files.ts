import {
  exportDataBackup,
  getDataBackupSummary,
  importDataBackup,
  parseDataBackupJson,
  type DataBackupSummary,
  type OwnLiftDataBackup,
} from "@ownlift/db";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const BACKUP_MIME_TYPE = "application/json";
const BACKUP_FILE_EXTENSION = "json";

export interface ExportedBackupFile {
  fileName: string;
  uri: string;
  summary: DataBackupSummary;
  shared: boolean;
}

export interface PickedBackupFile {
  backup: OwnLiftDataBackup;
  fileName: string;
  summary: DataBackupSummary;
}

function getBackupDirectory(): string {
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error("No writable file directory is available.");
  }

  return directory;
}

function getBackupFileName(exportedAt: string): string {
  const stamp = exportedAt
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  return `ownlift-backup-${stamp}.${BACKUP_FILE_EXTENSION}`;
}

export async function exportBackupFile(): Promise<ExportedBackupFile> {
  const backup = await exportDataBackup();
  const summary = getDataBackupSummary(backup);
  const fileName = getBackupFileName(backup.exportedAt);
  const uri = `${getBackupDirectory()}${fileName}`;

  await FileSystem.writeAsStringAsync(
    uri,
    JSON.stringify(backup, null, 2),
    { encoding: FileSystem.EncodingType.UTF8 },
  );

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      dialogTitle: "OwnLift Backup",
      mimeType: BACKUP_MIME_TYPE,
      UTI: "public.json",
    });
  }

  return {
    fileName,
    uri,
    summary,
    shared: canShare,
  };
}

export async function pickBackupFile(): Promise<PickedBackupFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: [BACKUP_MIME_TYPE, "text/json", "application/octet-stream", "*/*"],
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    throw new Error("No backup file was selected.");
  }

  const contents = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const backup = parseDataBackupJson(contents);

  return {
    backup,
    fileName: asset.name,
    summary: getDataBackupSummary(backup),
  };
}

export async function importBackupFile(backup: OwnLiftDataBackup): Promise<DataBackupSummary> {
  return importDataBackup(backup);
}
