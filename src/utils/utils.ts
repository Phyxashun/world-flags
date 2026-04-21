import type { FetchedData, FlagData } from '../types/types';
import { BASE_URL, countryData, DEFAULT_EXT, DOWNLOAD_DELAY, FLAG_HEIGHT, FLAG_WIDTH, JPG_WIDTH } from './Constants';

// Pauses an asynchronous function for a specific time
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates a formatted URL for an image resource.
 * @param width - The image width
 * @param height - The image height
 * @param fileName - The base name of the file
 * @param extension - The file extension (e.g., 'jpg', 'svg', 'png')
 * @returns A complete URL object
 */
export const createImageURL = (fileName: string, extension: string): URL => {
  let path;
  switch (extension) {
    case 'svg':
      path = `${fileName}.${extension}`;
      break;
    case 'jpg':
      path = `${JPG_WIDTH}/${fileName}.${extension}`;
      break;
    default:
      // 'png' or 'webp'
      path = `${FLAG_WIDTH}x${FLAG_HEIGHT}/${fileName}.${extension}`;
      break;
  }

  return new URL(path, BASE_URL);
};

export const fetchFlagData = async (code: string, name: string): Promise<FetchedData> => {
  const url = createImageURL(code, DEFAULT_EXT);

  // Use 'cors' mode for the request
  const response = await fetch(url, { mode: 'cors' });

  // Check for network errors or if the server response is not ok (e.g., 404)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${name}: ${response.statusText}`);
  }

  const blob = await response.blob();
  await sleep(1000);

  return { countryCode: code, countryName: name, blob };
};

/**
 * Creates the display element for a flag using pre-fetched data.
 * @param flagData - The successfully fetched flag data object.
 * @returns An HTMLDivElement to be displayed.
 */
export const createFlagElement = (flagData: FlagData): HTMLDivElement => {
  const div: HTMLDivElement = document.createElement('div');
  div.className = 'hero';

  const img: HTMLImageElement = document.createElement('img');
  img.src = flagData.objectURL;
  img.width = FLAG_WIDTH;
  img.height = FLAG_HEIGHT;
  img.alt = flagData.countryName;
  img.className = 'flag';

  const name: HTMLHeadingElement = document.createElement('h2');
  name.innerText = flagData.countryName;
  name.className = 'name';

  div.appendChild(img);
  div.appendChild(name);

  return div;
};

/**
 * Fetches all flags, handles errors, and then displays them.
 * @param container The HTML element to display the flags in.
 * @returns A promise that resolves with an array of the successfully fetched flag data.
 */
export const fetchAndDisplayFlags = async (container: HTMLElement): Promise<FlagData[]> => {
  container.innerHTML = '<h2>Loading flags...</h2>';
  container.className = 'hero-grid';
  const promises: Promise<FetchedData>[] = [];

  for (const country of countryData) {
    promises.push(fetchFlagData(country.code, country.name));
  }

  const results = await Promise.allSettled(promises);
  const successfullyFetchedFlags: FlagData[] = [];
  container.innerHTML = '';
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { countryCode, countryName, blob } = result.value;

      // Create a temporary local URL for the blob
      const objectURL = URL.createObjectURL(blob);
      const flagData: FlagData = { countryCode, countryName, blob, objectURL };
      successfullyFetchedFlags.push(flagData);

      const flagElement = createFlagElement(flagData);
      container.appendChild(flagElement);
    } else {
      //console.error(`❌ Failed to process a flag. Reason:`, result.reason);
    }
  });

  return successfullyFetchedFlags;
};

/**
 * Saves a pre-fetched blob directly to disk.
 * The canvas and imageToBlob functions are no longer needed!
 * @param flagData The data object containing the blob and name.
 */
export const saveBlobToDisk = async (flagData: FlagData): Promise<void> => {
  try {
    const fileName = `${flagData.countryName}${DEFAULT_EXT}`;

    const a: HTMLAnchorElement = document.createElement('a');
    a.style.display = 'none';
    a.href = flagData.objectURL;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error(`Failed to save image: ${flagData.countryName}`, error);
  }
};

export const handleOnClick = async (element: HTMLButtonElement, fetchedFlags: FlagData[]) => {
  console.log('Starting to save all flags...');
  element.disabled = true;
  element.textContent = 'Saving...';

  let successCount = 0;
  for (const flagData of fetchedFlags) {
    await saveBlobToDisk(flagData);
    successCount++;
    console.log(`✅ Saved ${successCount}/${fetchedFlags.length}: ${flagData.countryName}`);
    await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_DELAY));
  }

  console.log('--------------------');
  console.log('Finished saving process.');
  console.log(`Successfully saved: ${successCount}`);
  console.log('--------------------');

  element.disabled = false;
  element.textContent = 'Save All Flags';
  // IMPORTANT: Clean up all the object URLs after saving to prevent memory leaks
  fetchedFlags.forEach((flag) => URL.revokeObjectURL(flag.objectURL));
  console.log('Memory cleaned up.');
};
