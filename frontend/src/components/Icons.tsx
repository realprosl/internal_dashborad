// Iconos SVG profesionales para la aplicación

export const SortIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-4 h-4 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
    />
  </svg>
);

export const SortUpIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-4 h-4 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

export const SortDownIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-4 h-4 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const EditIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-5 h-5 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

export const DeleteIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-5 h-5 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export const CloseIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-5 h-5 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const SunIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-5 h-5 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
    />
  </svg>
);

export const MoonIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-5 h-5 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

export const BuildingIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-6 h-6 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

export const PersonIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-6 h-6 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export const CalendarIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-6 h-6 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export const DashboardIcon = (props: { class?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={`w-6 h-6 ${props.class || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

export const LogoRealpro = (props: { class?: string }) => (
  <svg
    viewBox="0 0 210 295"
    class={`${props.class || ""}`}
    stroke="currentColor"
    fill="currentColor"
  >
    {/* Path principal con borde */}
    <path
      id="path8"
      stroke="none"
      stroke-width="1"
      fill="none"
      d="M 200.32252,34.149662 C 163.78531,112.79992 107.89422,176.41167 26.779622,221.63124 c -0.17138,0.21607 -0.340583,0.43054 -0.507463,0.64286 5.020567,6.02981 10.983669,11.34883 17.697111,15.7856 C 99.937715,201.02638 189.88383,133.05101 200.32252,34.149662 Z m 2.43913,50.529216 C 157.47391,161.72837 122.42041,203.07165 53.267927,241.64707 c 9.071726,4.38183 18.94043,7.20942 29.120703,8.34368 50.11715,-34.54057 93.78293,-75.41523 120.37302,-165.311872 z M 86.692244,96.782532 C 43.143645,96.782474 7.8404365,132.08545 7.8402095,175.63405 c 4.5e-6,15.89795 4.8055695,31.42462 13.7862385,44.54302 l 0.001,0.001 0.06563,0.14831 0.02946,-0.01 c 0.0356,0.0519 0.07125,0.10374 0.10697,0.15555 0.243653,-0.14735 0.484222,-0.29298 0.722437,-0.43718 h 5.16e-4 l 4.189925,-1.42059 c 0.01416,0.0169 0.02657,0.0353 0.03721,0.0548 l 10.802958,-7.49205 0.522448,-44.25673 16.552995,0.3483 -0.348299,25.26461 5.74952,2.61379 8.886279,-7.49257 0.348816,-45.12799 h 16.204179 l 0.17415,24.91631 5.227067,2.61379 9.409251,-8.18968 0.17415,-43.90843 16.20418,-0.17415 v 20.38635 l 6.09833,3.31039 19.86339,-22.65133 c -2.25991,-1.71783 -4.51571,-3.324 -6.76548,-4.82192 C 121.91289,102.85615 104.56778,96.782486 86.692244,96.782532 Z M 193.00462,145.66275 c -36.18531,60.71461 -62.02248,83.45235 -99.932925,105.77029 h 0.01757 c 17.544835,-8e-5 34.651955,-5.01841 48.933975,-14.35468 l 5.60147,-5.18019 c 18.52168,-19.04786 30.85422,-41.21298 45.37987,-86.23545 z"
    />
    {/* Path interior (relleno) */}
    <path
      id="path8-fill"
      stroke="currentColor"
      stroke-width="1"
      fill="none"
      d="M 200.32252,34.149662 C 163.78531,112.79992 107.89422,176.41167 26.779622,221.63124 c -0.17138,0.21607 -0.340583,0.43054 -0.507463,0.64286 5.020567,6.02981 10.983669,11.34883 17.697111,15.7856 C 99.937715,201.02638 189.88383,133.05101 200.32252,34.149662 Z m 2.43913,50.529216 C 157.47391,161.72837 122.42041,203.07165 53.267927,241.64707 c 9.071726,4.38183 18.94043,7.20942 29.120703,8.34368 50.11715,-34.54057 93.78293,-75.41523 120.37302,-165.311872 z M 86.692244,96.782532 C 43.143645,96.782474 7.8404365,132.08545 7.8402095,175.63405 c 4.5e-6,15.89795 4.8055695,31.42462 13.7862385,44.54302 l 0.001,0.001 0.06563,0.14831 0.02946,-0.01 c 0.0356,0.0519 0.07125,0.10374 0.10697,0.15555 0.243653,-0.14735 0.484222,-0.29298 0.722437,-0.43718 h 5.16e-4 l 4.189925,-1.42059 c 0.01416,0.0169 0.02657,0.0353 0.03721,0.0548 l 10.802958,-7.49205 0.522448,-44.25673 16.552995,0.3483 -0.348299,25.26461 5.74952,2.61379 8.886279,-7.49257 0.348816,-45.12799 h 16.204179 l 0.17415,24.91631 5.227067,2.61379 9.409251,-8.18968 0.17415,-43.90843 16.20418,-0.17415 v 20.38635 l 6.09833,3.31039 19.86339,-22.65133 c -2.25991,-1.71783 -4.51571,-3.324 -6.76548,-4.82192 C 121.91289,102.85615 104.56778,96.782486 86.692244,96.782532 Z M 193.00462,145.66275 c -36.18531,60.71461 -62.02248,83.45235 -99.932925,105.77029 h 0.01757 c 17.544835,-8e-5 34.651955,-5.01841 48.933975,-14.35468 l 5.60147,-5.18019 c 18.52168,-19.04786 30.85422,-41.21298 45.37987,-86.23545 z"
    />
  </svg>
);
