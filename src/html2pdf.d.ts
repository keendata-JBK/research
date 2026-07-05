declare module 'html2pdf.js' {
  type Worker = {
    set(options: Record<string, unknown>): Worker;
    from(element: HTMLElement): Worker;
    save(): Promise<void>;
    outputPdf(type?: string, options?: unknown): Promise<unknown>;
  };
  const html2pdf: () => Worker;
  export default html2pdf;
}
