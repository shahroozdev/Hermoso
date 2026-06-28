// import { generateAsciiUrl } from "@/lib/GenerateAsciiUrl";
// import SuggestionsSkeleton from "@/skeletons/searchSuggestionSkeleton";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
interface SearchSuggestion {
  id: string;
  type: "recent" | "trending" | "user" | "topic";
  text: string;
  subtitle?: string;
}
const Searchbar = () => {
  const [location] = useState("");
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [, setIsLoadingSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  // ✅ Debounced API fetch
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchValue.trim().length > 1 && !isNavigating) {
        setIsLoadingSuggestions(true);
        setShowSuggestions(true);

        try {
          // const res = await getServerSideDataWithFeatures({
          //   url: `/school/employee/suggestions?q=${searchValue}&country=${location}`,
          // });
          // setFilteredSuggestions(res?.data);
        } catch {
          setFilteredSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setFilteredSuggestions([]);
      }
    }, 300); // wait 300ms after typing

    return () => clearTimeout(delayDebounce);
  }, [searchValue, isNavigating, location]);
  // ✅ Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setIsNavigating(true);
    setSearchValue(suggestion.text);
    setShowSuggestions(false);
    // Optional: trigger search navigation
    const links = {
      // Reviewee: `/response/${generateAsciiUrl(suggestion?.id?.split("-")[1])}`,
      Country: `/dashboard?country=${suggestion?.text}`,
      Category: `/dashbaord?categoryId=${suggestion?.id?.split("-")[1]}`,
      School: `/dashboard?school=${suggestion?.text}`,
      Branch: `/dashboard?school=${encodeURI(suggestion?.text)}`,
    } as Record<string, string>;
    navigate(
      links[suggestion?.subtitle as string] ??
        `?q=${encodeURIComponent(suggestion.text)}`,
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setIsNavigating(false);
    setShowSuggestions(true);
    // if (e.target.value.trim()) {
    //   setIsLoadingSuggestions(true);
    // }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };
  return (
    <div className="bg-[var(--surface-soft)] hidden md:block max-w-60 w-52 border border-border border-solid  z-10 relative p-1 rounded-xl  shadow-lg  sm:mx-auto mx-auto">
      <div className="grid grid-cols-12 sm:gap-2 gap-1">
        <div
          className=" col-span-12 flex items-center border-[1px] rounded-md border-none bg-[var(--surface-soft)] px-2 relative"
          ref={searchRef}
        >
          <svg
            viewBox="0 0 24 24"
            className=" h-4 w-4 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            fontSize={"24px"}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="Search clients, bookings"
            value={searchValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className=" !bg-transparent text-xs text-[var(--text)] p-1 !outline-none !border-none placeholder:text-muted"
          />
          {showSuggestions && searchValue.length > 1 ? (
            <>
              {/* {isLoadingSuggestions ? (
                <SuggestionsSkeleton />
              ) : ( */}
                <div className="absolute top-full left-0 right-0 bg-[var(--surface-soft)] border border-[var(--border)] text-left rounded-md shadow-lg z-20 mt-1 max-h-80 overflow-y-auto">
                  {filteredSuggestions?.length > 0 ? (
                    <>
                      {filteredSuggestions?.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {suggestion.text}
                            </div>
                            {suggestion.subtitle && (
                              <div className="text-xs text-gray-500">
                                {suggestion.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                        <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                          Results for "{searchValue}"
                        </button>
                      </div>
                    </>
                  ) : (
                    searchValue.trim().length > 1 && (
                      <div className="px-4 py-6 text-center text-gray-500">
                        {/* <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" /> */}
                        <p className="text-sm">No suggestions found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try different keywords
                        </p>
                      </div>
                    )
                  )}
                </div>
              {/* )} */}
            </>
          ) : (
            <></>
          )}
        </div>
        {/* <div className="col-span-4 sm:flex items-center border-[1px] rounded-md border-border bg-white px-2 hidden relative">
          <MapPin className=" text-muted-foreground  sm:w-4 sm:h-4 w-3 h-3 " />
          <input
            placeholder="Country"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="py-2 text-base bg-background border-0  [&::placeholder]:text-[16px] sm:h-8 h-6 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-transparent"
          />
        </div> */}
        {/* <div className="col-span-1">
          <Button className="w-full py-3 text-base bg-primary hover:bg-primary/90 font-medium sm:h-8 h-6">
            <Search className=""/>
          </Button>
        </div> */}
      </div>
    </div>
  );
};

export default Searchbar;
