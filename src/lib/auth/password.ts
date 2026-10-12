/**
 * bcrypt hanya memakai 72 byte pertama password: sisanya diabaikan diam-diam sehingga password yang lebih panjang
 * memberi rasa aman palsu. Password BARU dibatasi 72 byte; login tidak menolak (akun lama tetap bisa masuk).
 */
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_TOO_LONG = "Password terlalu panjang (maks 72 karakter).";
export const passwordTooLong = (v: string) => Buffer.byteLength(v, "utf8") > PASSWORD_MAX_BYTES;
