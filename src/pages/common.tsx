import GUI from "lil-gui";

export interface PageProps {
  currentScene: string;
}

// Utility function to find or create nested folders
export const GetNestedFolder = (gui: GUI, path: string[]): GUI => {
  return path.reduce((folder, name) => {
    // Try to find existing folder
    const existingFolder = folder.folders.find((f) => f._title === name);
    if (existingFolder) {
      return existingFolder;
    }
    // Create new folder if it doesn't exist
    return folder.addFolder(name);
  }, gui);
};
