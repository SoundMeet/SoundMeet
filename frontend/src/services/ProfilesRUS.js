// This file I made for specific linking to the profile. It uses the Navigate() function to navigate to a person's database, and the profileID() parameter to gather the person's profile , and then it goes back to the wrapper. nice stuff
// if you wanna use it or link any button to the profile, literally just import the function and then use it like this: ProfilesRUS(navigate, profileId) and it will do the rest for you.
export function ProfilesRUS(navigate, profileId) {
  if (!profileId) return;
  navigate(`/profile/${profileId}`);
}
