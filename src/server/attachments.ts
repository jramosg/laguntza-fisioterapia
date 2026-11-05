import { isAllowedAttachment } from '../lib/contact.ts';

// Signatures reject common renamed binaries. They are not a malware scanner.
const formats = {
	pdf: { mime: 'application/pdf', signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
	png: {
		mime: 'image/png',
		signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
	},
	jpg: { mime: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
	doc: {
		mime: 'application/msword',
		signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
	},
	docx: {
		mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		signature: [0x50, 0x4b, 0x03, 0x04]
	}
};

export async function attachmentContentType(
	file: File
): Promise<string | undefined> {
	if (!isAllowedAttachment(file)) return;
	const extension = file.name
		.split('.')
		.at(-1)!
		.toLowerCase()
		.replace('jpeg', 'jpg');
	const declared = file.type.toLowerCase().split(';')[0].trim();
	if (extension === 'txt') {
		if (
			declared &&
			!['text/plain', 'application/octet-stream'].includes(declared)
		)
			return;
		try {
			const text = new TextDecoder('utf-8', { fatal: true }).decode(
				await file.arrayBuffer()
			);
			if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return;
			return 'text/plain';
		} catch {
			return;
		}
	}
	const format = formats[extension as keyof typeof formats];
	if (
		!format ||
		(declared && ![format.mime, 'application/octet-stream'].includes(declared))
	)
		return;
	const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
	if (!format.signature.every((byte, index) => bytes[index] === byte)) return;
	if (extension === 'docx') {
		// Inspect ZIP filenames without decompressing or extracting untrusted data.
		const archive = Buffer.from(await file.arrayBuffer());
		if (
			!archive.includes(Buffer.from('[Content_Types].xml')) ||
			!archive.includes(Buffer.from('word/document.xml')) ||
			archive.includes(Buffer.from('vbaProject.bin'))
		)
			return;
	}
	return format.mime;
}
