/**
 * Utilitário para leitura e extração de texto de arquivos para a Base de Conhecimento (RAG).
 * Executa 100% no cliente (browser) com suporte a .txt, .md, .json, .csv.
 */

export interface ParsedFileResult {
  title: string;
  fileName: string;
  fileType: "text" | "markdown" | "json" | "csv" | "pdf" | "manual";
  content: string;
  charCount: number;
}

export async function parseKnowledgeFile(file: File): Promise<ParsedFileResult> {
  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // Determina o tipo de arquivo
  let fileType: ParsedFileResult["fileType"] = "text";
  if (ext === "md" || ext === "markdown") fileType = "markdown";
  else if (ext === "json") fileType = "json";
  else if (ext === "csv") fileType = "csv";
  else if (ext === "pdf") fileType = "pdf";

  // Gera um título amigável baseado no nome do arquivo
  const title = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  // Leitura do conteúdo
  let rawText = "";

  try {
    rawText = await file.text();
  } catch (err: any) {
    throw new Error(`Falha ao ler o arquivo "${fileName}": ${err?.message || "Erro desconhecido"}`);
  }

  // Sanitização e normalização de quebras de linha
  const cleanedContent = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!cleanedContent) {
    throw new Error(`O arquivo "${fileName}" está vazio ou não contém texto legível.`);
  }

  return {
    title: title || "Documento sem título",
    fileName,
    fileType,
    content: cleanedContent,
    charCount: cleanedContent.length,
  };
}
