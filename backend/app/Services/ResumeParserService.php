<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser as PdfParser;

class ResumeParserService
{
    /**
     * Extract raw text from an uploaded file.
     */
    public function extractText(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'pdf'  => $this->extractFromPdf($file),
            'docx' => $this->extractFromDocx($file),
            'txt'  => $this->extractFromTxt($file),
            default => throw new \InvalidArgumentException("Unsupported file type: {$extension}"),
        };
    }

    private function extractFromTxt(UploadedFile $file): string
    {
        return file_get_contents($file->getRealPath());
    }

    private function extractFromPdf(UploadedFile $file): string
    {
        try {
            $parser = new PdfParser();
            $pdf = $parser->parseFile($file->getRealPath());
            $text = $pdf->getText();
            return $text ?: $this->fallbackPdfExtraction($file);
        } catch (\Throwable $e) {
            Log::warning('PDF parser failed, using fallback: ' . $e->getMessage());
            return $this->fallbackPdfExtraction($file);
        }
    }

    private function fallbackPdfExtraction(UploadedFile $file): string
    {
        $raw = file_get_contents($file->getRealPath());
        // Extract readable text between stream markers
        preg_match_all('/BT(.+?)ET/s', $raw, $matches);
        $text = '';
        foreach ($matches[1] as $block) {
            preg_match_all('/\(([^)]+)\)/', $block, $strings);
            $text .= implode(' ', $strings[1]) . ' ';
        }
        // Clean non-printable characters
        $text = preg_replace('/[^\x20-\x7E\n\r\t]/', ' ', $text);
        return trim($text) ?: 'Unable to extract text from PDF';
    }

    private function extractFromDocx(UploadedFile $file): string
    {
        try {
            $zip = new \ZipArchive();
            $path = $file->getRealPath();
            if ($zip->open($path) !== true) {
                throw new \RuntimeException('Cannot open DOCX file');
            }
            $xml = $zip->getFromName('word/document.xml');
            $zip->close();

            if ($xml === false) {
                throw new \RuntimeException('word/document.xml not found in DOCX');
            }

            // Remove XML tags and decode entities
            $text = strip_tags(str_replace(
                ['</w:p>', '</w:tr>', '<w:tab/>'],
                ["\n", "\n", "\t"],
                $xml
            ));
            $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            return preg_replace('/[ \t]+/', ' ', trim($text));
        } catch (\Throwable $e) {
            Log::error('DOCX parsing failed: ' . $e->getMessage());
            throw new \RuntimeException('Failed to parse DOCX file: ' . $e->getMessage());
        }
    }
}
