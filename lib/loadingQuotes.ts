// Funny, inspirational, and encouraging quotes for loading screens

export const adminQuotes = [
  "Managing the fleet like a boss...",
  "Counting cars and making stars...",
  "Admin powers activating...",
  "Organizing chaos, one rental at a time...",
  "Dashboard loading... Coffee recommended",
  "Preparing your command center...",
  "Revving up the admin engine...",
  "Your kingdom of wheels awaits...",
  "Loading car empire data...",
  "Admin mode: Engage!",
];

export const ownerQuotes = [
  "Your cars are waiting for you!",
  "Time to make those wheels earn!",
  "Great cars deserve great owners...",
  "Loading your automotive empire...",
  "Preparing to put smiles on wheels!",
  "Your dashboard is almost ready to roll...",
  "Keys to success loading...",
  "Rev up those earnings!",
  "Getting your fleet ready...",
  "Car ownership never looked this good!",
];

export const renterQuotes = [
  "Adventure is just a rental away!",
  "Finding your perfect ride...",
  "Great journeys start with great cars!",
  "Your next adventure is loading...",
  "Buckle up for something awesome!",
  "The open road awaits you...",
  "Life is a highway... Finding your car!",
  "Dream car loading...",
  "Your wheels of freedom are coming...",
  "Getting ready to hit the road!",
];

export const generalQuotes = [
  "Life's a journey, enjoy the ride!",
  "Good things come to those who wait...",
  "Fueling up the experience...",
  "Almost there... Like a road trip!",
  "Loading awesomeness...",
  "Patience is a virtue... Unlike speeding!",
  "Preparing something special...",
  "The journey is the destination...",
  "Great things take time... This won't!",
  "Buckle up! Loading...",
];

export const savingQuotes = [
  "Saving faster than a pit stop!",
  "Securing your changes...",
  "Making magic happen...",
  "Processing at highway speed!",
  "Almost saved... Patience, young driver!",
  "Storing awesomeness...",
  "Your data is in good hands!",
  "Saving like a pro...",
  "One moment... Perfection takes time!",
  "Committing your brilliance...",
];

export const deletingQuotes = [
  "Saying goodbye...",
  "Making room for new adventures...",
  "Cleaning up the garage...",
  "Removing with care...",
  "Out with the old...",
  "Tidying up your collection...",
  "Processing deletion... Almost done!",
  "Clearing the way...",
];

export const creatingQuotes = [
  "Building something amazing!",
  "Creating magic...",
  "Crafting perfection...",
  "Your masterpiece is loading...",
  "Almost ready to roll!",
  "Bringing your vision to life...",
  "Setting up for success!",
  "Making it happen...",
  "Creating awesomeness...",
];

// Helper function to get a random quote from an array
export function getRandomQuote(quotes: string[]): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
