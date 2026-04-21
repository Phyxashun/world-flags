export const main = async () => {
  const appContainer = document.querySelector<HTMLDivElement>('#app');
  if (!appContainer) return;

  // Create UI Elements
  const flagContainer = document.createElement('div');
  flagContainer.id = 'flag-container';

  const title = document.createElement('h1');
  title.textContent = 'Country Flags';

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save All Flags';
  saveButton.id = 'save-all-button';
  saveButton.disabled = true;

  // Disabled until flags are loaded
  appContainer.appendChild(title);
  appContainer.appendChild(flagContainer);
  appContainer.appendChild(saveButton);

  // Fetch and display all the flags, this returns our array of successfully fetched data
  const fetchedFlags = await fetchAndDisplayFlags(flagContainer);

  // Once loading is complete, enable the save button
  saveButton.disabled = false;
  console.log(`Successfully loaded ${fetchedFlags.length} flags.`);

  // Add the event listener for the save button
  saveButton.addEventListener('click', () => handleOnClick(saveButton, fetchedFlags));
};

// Run the main application
main();
