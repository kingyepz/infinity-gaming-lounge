declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: any);
    pipe(destination: any): this;
    fontSize(size: number): this;
    font(string: string): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color: string): this;
    y: number;
    addPage(options?: any): this;
    end(): void;
    heightOfString(text: string, options?: any): number;
  }
  
  export default PDFDocument;
}