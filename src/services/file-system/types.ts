export type IFileSystemService = {
  // readFile: (path: string) => Promise<string>
  // writeFile: (path: string, content: string) => Promise<void>
  promisifyFs: any;
  fsExtra: any;
};
