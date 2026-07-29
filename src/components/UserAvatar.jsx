import {
  useEffect,
  useState,
} from "react";


export default function UserAvatar({

  name,

  profilePictureUrl,

  size = "medium",

  className = "",

}) {

  const [imageError, setImageError] =
    useState(false);


  /*
   * If the profile picture changes,
   * allow the new URL to load again.
   */

  useEffect(() => {

    setImageError(false);

  }, [profilePictureUrl]);


  const hasImage =

    Boolean(
      profilePictureUrl
    ) &&

    !imageError;


  return (

    <div

      className={`
        user-avatar
        user-avatar-${size}
        ${className}
      `}

      aria-label={
        name
          ? `${name}'s profile picture`
          : "Profile picture"
      }

    >

      {hasImage ? (

        <img

          src={
            profilePictureUrl
          }

          alt=""

          className="user-avatar-image"

          onError={() =>
            setImageError(true)
          }

        />

      ) : (

        <span className="user-avatar-initials">

          {getInitials(
            name
          )}

        </span>

      )}

    </div>

  );

}


// ---------------------------------------------------------------
// INITIALS FALLBACK
// ---------------------------------------------------------------

function getInitials(
  name
) {

  if (!name) {

    return "";

  }


  const words =

    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (
    words.length === 0
  ) {

    return "";

  }


  if (
    words.length === 1
  ) {

    return words[0]
      .charAt(0)
      .toUpperCase();

  }


  return (

    words[0]
      .charAt(0) +

    words[
      words.length - 1
    ]
      .charAt(0)

  ).toUpperCase();

}