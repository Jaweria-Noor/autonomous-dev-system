import fs from "fs";
import path from "path";
const archiverPkg = await import("archiver");

const archiver = typeof archiverPkg === "function"
  ? archiverPkg
  : archiverPkg.default ?? archiverPkg;

function getFilesRecursive(dir, baseDir, excludes = []) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const relativePath = path
      .relative(baseDir, filePath)
      .replace(/\\/g, "/");

    const shouldExclude = excludes.some(
      (ex) =>
        relativePath === ex || relativePath.startsWith(ex + "/")
    );

    if (shouldExclude) continue;

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(
        getFilesRecursive(filePath, baseDir, excludes)
      );
    } else {
      results.push({ filePath, relativePath });
    }
  }

  return results;
}

export function buildDeploymentZip(sourceDir, outZipPath) {
  return new Promise((resolve, reject) => {
    try {
      const excludes = [
        "node_modules",
        ".git",
        "logs",
        "screenshots",
        "traces",
      ];

      const allFiles = getFilesRecursive(sourceDir, sourceDir, excludes);

      console.log(`[ZIP] Found ${allFiles.length} files`);

      const output = fs.createWriteStream(outZipPath);

      // ✅ IMPORTANT FIX: Handle archiver v8 (classes) and older versions (factory function)
      let archive;
      if (typeof archiver === "function") {
        archive = archiver("zip", { zlib: { level: 9 } });
      } else if (archiverPkg && typeof archiverPkg.ZipArchive === "function") {
        archive = new archiverPkg.ZipArchive({ zlib: { level: 9 } });
      } else if (archiver && typeof archiver.ZipArchive === "function") {
        archive = new archiver.ZipArchive({ zlib: { level: 9 } });
      } else {
        throw new Error("Could not resolve archiver constructor");
      }

      archive.on("error", reject);

      output.on("close", () => {
        resolve({
          success: true,
          fileCount: allFiles.length,
          sizeBytes: output.bytesWritten,
        });
      });

      archive.pipe(output);

      for (const file of allFiles) {
        archive.file(file.filePath, { name: file.relativePath });
      }

      archive.finalize();
    } catch (err) {
      console.error("[ZIP] Archiver error:", err);
      // Graceful fallback: packaging must always succeed or return safe error object
      resolve({
        success: false,
        error: err.message,
        fileCount: 0,
        sizeBytes: 0,
      });
    }
  });
}