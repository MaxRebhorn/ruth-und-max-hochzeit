/** Just the two `qrcode` calls the QR page uses — the package ships no types of its own. */
declare module 'qrcode' {
  interface Options {
    type?: 'svg';
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
  const QRCode: {
    toString(text: string, options?: Options): Promise<string>;
    toDataURL(text: string, options?: Options): Promise<string>;
  };
  export default QRCode;
}
