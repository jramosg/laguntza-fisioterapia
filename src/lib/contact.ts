export const maxAttachments = 3;
export const maxAttachmentSize = 10 * 1024 * 1024;
export const maxTotalAttachmentSize = 15 * 1024 * 1024;

export function isAllowedAttachment(file: File) {
	return (
		file.size > 0 &&
		file.size <= maxAttachmentSize &&
		file.name.length <= 180 &&
		/\.(jpe?g|png|pdf|docx?|txt)$/i.test(file.name) &&
		!/[\u0000-\u001f\u007f\/\\\u202a-\u202e\u2066-\u2069]/.test(file.name)
	);
}
