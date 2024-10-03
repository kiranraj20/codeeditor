import { useState } from "react";
import { LANGUAGE_VERSIONS } from "../constants";

const languages = Object.entries(LANGUAGE_VERSIONS);
// const ACTIVE_COLOR = "blue-400";

const LanguageSelector = ({ language, onSelect }) => {
  const [dropdown, setDropdown] = useState(false);

  const handleDropdown = () => {
    setDropdown(!dropdown);
  };

  return (
    <div className="ml-2 mb-4">
      <div className="mb-4 text-lg">Language:</div>
      <div className="relative">
        <button
          id="dropdownDelayButton"
          data-dropdown-toggle="dropdownDelay"
          data-dropdown-delay="500"
          data-dropdown-trigger="hover"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
          onClick={() => handleDropdown()}
        >
          {language}
          <svg
            className="w-2.5 h-2.5 ms-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 4 4 4-4"
            />
          </svg>
        </button>
        <div
          id="dropdownDelay"
          className={`z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 absolute ${
            dropdown ? "block" : "hidden"
          }`}
        >
          <ul
            className="p-2 text-sm text-gray-700 dark:text-gray-200"
            aria-labelledby="dropdownDelayButton"
          >
            {languages.map(([lang, version]) => (
              <div
                key={lang}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer rounded-md "
                onClick={() => {
                  onSelect(lang);
                  handleDropdown();
                }}
              >
                {lang}
                &nbsp;
                <span className="color-gray.600 text-sm">({version})</span>
              </div>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
export default LanguageSelector;
