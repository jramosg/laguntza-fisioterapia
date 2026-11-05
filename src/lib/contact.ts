export const maxAttachments = 3;
export const maxAttachmentSize = 5 * 1024 * 1024;

export function isAllowedAttachment(file: File) {
	return (
		file.size > 0 &&
		file.size <= maxAttachmentSize &&
		file.name.length <= 180 &&
		/\.(jpe?g|png|pdf|docx?|txt)$/i.test(file.name) &&
		!/[\r\n\/\\]/.test(file.name)
	);
}
