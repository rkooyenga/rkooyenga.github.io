/**
 * Gists module.
 */

/**
 * Create API URL for getting gists for a user, optionally filtering by update date.
 *
 * The API sets a max of up to 100 items per page. Using 'since' helps if you
 * have many gists but only want recent ones. For >100 recent gists, pagination
 * would still be needed.
 * @param {string} username - GitHub username.
 * @param {number} [limit=100] - Max items per page.
 * @param {string|null} [sinceDate=null] - ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ).
 *                                         If provided, only gists updated at or
 *                                         after this time are returned.
 */
function gistsApiUrl(username, limit = 100, sinceDate = null) {
  let url = `https://api.github.com/users/${username}/gists?per_page=${limit}`;
  if (sinceDate) {
    // Ensure the date is properly URL-encoded in case of special characters (though ISO 8601 is usually safe)
    url += `&since=${encodeURIComponent(sinceDate)}`;
  }
  return url;
}

async function requestJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    // Provide more context in the error
    const errorBody = await resp.text();
    throw new Error(
      `HTTP error: ${resp.status} - ${resp.statusText}. URL: ${url}. Response: ${errorBody}`
    );
  }
  return resp.json();
}

const Gists = {
  name: "Gists",
  props: {
    username: { type: String, required: true },
    filter: { type: String, required: true }, // For description filtering
  },
  data() {
    return {
      gists: null,
      loading: true,
      errored: false,
      errorMsg: "",
      // --- Define your date threshold here ---
      // Format: YYYY-MM-DDTHH:MM:SSZ (UTC is important)
      // Example: Only show gists updated on or after Jan 1st, 2022 UTC
      sinceDateThreshold: "2020-01-01T00:00:00Z",
    };
  },
  methods: {
    // requestJson is now outside the component, no change needed here

    async render() {
      // Construct the URL using the threshold date
      const url = gistsApiUrl(this.username, 100, this.sinceDateThreshold);

      console.debug(`Fetching gists: ${url}`);
      this.loading = true; // Ensure loading is true at the start
      this.errored = false;
      this.gists = null; // Clear previous results

      try {
        let fetchedGists = await requestJson(url);

        // --- Sort the fetched (and already date-filtered) gists ---
        // Sort by 'updated_at' date, descending (most recent first)
        fetchedGists.sort((a, b) => {
          // new Date() conversion is robust; ISO strings often compare correctly too
          return new Date(b.updated_at) - new Date(a.updated_at);
          // String comparison alternative (might be slightly faster if format is guaranteed):
          // if (a.updated_at < b.updated_at) return 1;
          // if (a.updated_at > b.updated_at) return -1;
          // return 0;
        });

        this.gists = fetchedGists;

      } catch (err) {
        const msg = `Unable to fetch Gists API data. Error: ${err}`;
        console.error(msg);
        this.gists = null; // Ensure gists is null on error
        this.errored = true;
        this.errorMsg = msg;
      } finally {
        this.loading = false;
      }
    },

    // Keep the description filter logic
    contains(value, filter) {
      if (filter === "") {
        return true;
      }
      // Handle case where gist description might be null or undefined
      const description = value || "";
      if (typeof description !== "string") {
         console.warn(`Expected value as string but got: ${typeof description}`, value);
         return false; // Or true, depending on desired behavior for non-strings
      }
      return description.toLowerCase().includes(filter.toLowerCase());
    },
  },
  mounted() {
    this.render(); // Fetch and render on component mount
  },
  template: `
    <section>
      <div v-if="errored">
        <p>
          <b>⚠️ Failed to fetch gists data.</b>
        </p>
        <p>
          <i>{{ errorMsg }}</i>
        </p>
        <p>
          Tip - check your network connection, that the GitHub username ('{{ username }}') is valid, or if the API limit has been reached. The API may also be temporarily unavailable.
        </p>
      </div>

      <div v-else>
         <!-- Update loading message -->
         <p v-if="loading">
             ⏳ Loading gists updated since {{ sinceDateThreshold.slice(0, 10) }}...
         </p>

        <!-- Only show table if not loading AND gists is not null -->
        <table v-if="!loading && gists">
          <thead> <!-- Added thead for semantics -->
            <tr>
              <th>
                Description
              </th>
              <th>
                Files
              </th>
              <th>
                Updated
              </th>
              <th>
                Created
              </th>
            </tr>
          </thead>
          <tbody> <!-- Added tbody for semantics -->
            <!-- 1. Loop through gists (already sorted by date) -->
            <!-- 2. Use gist.id as the key -->
            <!-- 3. Apply description filter using v-if on the TR -->
            <tr v-for="gist in gists"
                :key="gist.id"
                v-if="contains(gist.description, filter)">
              <td>
                <a :href="gist.html_url" target="_blank" rel="noopener noreferrer">
                  <!-- Handle null/empty descriptions -->
                  {{ gist.description || '(No description)' }}
                </a>
              </td>
              <td>
                <!-- Check if files object exists before getting keys -->
                {{ gist.files ? Object.keys(gist.files).length : 0 }}
              </td>
              <td>
                <!-- Slice date portion -->
                {{ gist.updated_at ? gist.updated_at.slice(0, 10) : 'N/A' }}
              </td>
              <td>
                {{ gist.created_at ? gist.created_at.slice(0, 10) : 'N/A' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Message if loading finished but no gists match the filter/date -->
        <p v-if="!loading && gists && gists.filter(gist => contains(gist.description, filter)).length === 0">
          No gists found matching your filter criteria (and updated since {{ sinceDateThreshold.slice(0, 10) }}).
        </p>
        <!-- Message if loading finished but API returned no gists at all (before description filter) -->
         <p v-else-if="!loading && gists && gists.length === 0">
          No gists found updated since {{ sinceDateThreshold.slice(0, 10) }}.
        </p>
      </div>
    </section>
  `,
};

export default Gists;
