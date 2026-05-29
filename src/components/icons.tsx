interface IconProps {
  className?: string
}

export function WorkspaceIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M8 3.5C4.5 3.5 1.5 8 1.5 8s3 4.5 6.5 4.5S14.5 8 14.5 8 11.5 3.5 8 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M8 14S1.5 10 1.5 5.5A3.5 3.5 0 018 4a3.5 3.5 0 016.5 1.5C14.5 10 8 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <line x1="8" y1="8" x2="16" y2="16" />
      <line x1="16" y1="8" x2="8" y2="16" />
    </svg>
  )
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M15.8333 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.50001 9.16665C8.42048 9.16665 9.16668 8.42045 9.16668 7.49998C9.16668 6.57951 8.42048 5.83331 7.50001 5.83331C6.57954 5.83331 5.83334 6.57951 5.83334 7.49998C5.83334 8.42045 6.57954 9.16665 7.50001 9.16665Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 12.5L14.9283 9.92835C14.6158 9.61589 14.1919 9.44037 13.75 9.44037C13.3081 9.44037 12.8842 9.61589 12.5717 9.92835L5 17.5"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function VideoIcon({ className }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M13.3333 10.8333L17.6858 13.735C17.7486 13.7768 17.8215 13.8007 17.8968 13.8043C17.972 13.8079 18.0469 13.791 18.1133 13.7554C18.1798 13.7199 18.2353 13.6669 18.2741 13.6023C18.3128 13.5376 18.3333 13.4637 18.3333 13.3883V6.55833C18.3334 6.48502 18.314 6.41299 18.2773 6.34954C18.2406 6.28608 18.1878 6.23343 18.1242 6.19691C18.0607 6.16039 17.9886 6.14129 17.9153 6.14154C17.8419 6.14179 17.77 6.16138 17.7067 6.19833L13.3333 8.75"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6667 5H3.33332C2.41285 5 1.66666 5.74619 1.66666 6.66667V13.3333C1.66666 14.2538 2.41285 15 3.33332 15H11.6667C12.5871 15 13.3333 14.2538 13.3333 13.3333V6.66667C13.3333 5.74619 12.5871 5 11.6667 5Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SmileIcon({ className }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M10 18.3334C14.6024 18.3334 18.3334 14.6024 18.3334 10C18.3334 5.39765 14.6024 1.66669 10 1.66669C5.39765 1.66669 1.66669 5.39765 1.66669 10C1.66669 14.6024 5.39765 18.3334 10 18.3334Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66669 11.6667C6.66669 11.6667 7.91669 13.3334 10 13.3334C12.0834 13.3334 13.3334 11.6667 13.3334 11.6667"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 7.5H7.50833"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 7.5H12.5083"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CommentIcon({ className }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M2 2.5h12a.5.5 0 01.5.5v8a.5.5 0 01-.5.5H5L2 14V3a.5.5 0 01.5-.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}
