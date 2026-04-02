/**
 * ShowDetailSections — promote_show specific supplemental content.
 * Emphasizes venue, lineup, and genre.
 */

const ShowDetailSections = ({ item }) => {
  const venue     = item?.venueName  ?? null;
  const genres    = item?.genres     ?? [];
  const venueType = item?.venueType  ?? null;
  const lineup    = Array.isArray(item?.lineup) ? item.lineup : [];

  if (!venue && !genres.length && !venueType && !lineup.length) return null;

  return (
    <div className="px-7 py-5 space-y-4">
      {/* Venue */}
      {venue && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-1">
            Venue
          </p>
          <p className="text-sm text-neutral-300">{venue}</p>
          {venueType && (
            <p className="text-[11px] text-neutral-600 mt-0.5">{venueType}</p>
          )}
        </div>
      )}

      {/* Lineup */}
      {lineup.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-2">
            Lineup
          </p>
          <div className="flex flex-wrap gap-2">
            {lineup.map((act, i) => (
              <span
                key={act.id ?? i}
                className="inline-flex items-center gap-2 h-7 pl-3 pr-3 rounded-xl text-[12px] font-medium text-neutral-300"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                {act.name}
                {act.role && (
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "#F7C10D" }}
                  >
                    {act.role}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Genres */}
      {genres.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 mb-2">
            Genre
          </p>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <span
                key={g}
                className="h-6 px-2.5 flex items-center rounded-lg text-[11px] font-medium text-neutral-400 border border-white/[0.09]"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowDetailSections;
