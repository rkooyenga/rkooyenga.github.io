/**
 * Gists module.
 */

// --- gistsApiUrl and requestJson functions remain the same ---
function gistsApiUrl(username, limit = 100, sinceDate = null) {
  let url = `https://api.github.com/users/${username}/gists?per_page=${limit}`;
  if (sinceDate) {
    url += `&since=${encodeURIComponent(sinceDate)}`;
  }
  return url;
}

async function requestJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
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
      gists: null, // Stores the raw, sorted list from the API
      loading: true,
      errored: false,
      errorMsg: "",
      sinceDateThreshold: "2020-01-01T00:00:00Z",
    };
  },
  // --- NEW: Computed Property ---
  computed: {
    /**
     * Returns the gists filtered by the description input.
     * Handles null/empty gists array gracefully.
     */
    filteredGists() {
      // If gists haven't loaded or errored, return empty array
      if (!this.gists || !Array.isArray(this.gists)) {
        return [];
      }
      // If no filter text, return all fetched gists
      if (!this.filter) {
        return this.gists;
      }
      // Apply the filter
      const lowerCaseFilter = this.filter.toLowerCase();
      return this.gists.filter(gist => {
        const description = gist.description || "";
        return description.toLowerCase().includes(lowerCaseFilter);
      });
    }
  },
  methods: {
    // --- No change needed in contains method logic itself ---
    // (It's now mainly used by the computed property)
    contains(value, filter) {
       // This method is technically not directly called by the template anymore,
       // but the logic is moved into the computed property.
       // We could even inline this logic into the computed property if preferred.
      if (filter === "") {
        return true;
      }
      const description = value || "";
      if (typeof description !== "string") {
         console.warn(`Expected value as string but got: ${typeof description}`, value);
         return false;
      }
      // Use includes() for simplicity, like in computed prop
      return description.toLowerCase().includes(filter.toLowerCase());
    },

    async render() {
      const url = gistsApiUrl(this.username, 100, this.sinceDateThreshold);
      console.debug(`Fetching gists: ${url}`);
      this.loading = true;
      this.errored = false;
      this.gists = null; // Reset before fetch

      try {
        let fetchedGists = await requestJson(url);
        // Sort by 'updated_at' descending
        fetchedGists.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        this.gists = fetchedGists; // Update the raw gists list
      } catch (err) {
        const msg = `Unable to fetch Gists API data. Error: ${err}`;
        console.error(msg);
        this.gists = null;
        this.errored = true;
        this.errorMsg = msg;
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.render();
  },
  // --- TEMPLATE MODIFIED ---
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
         <p v-if="loading">
             ⏳ Loading gists updated since {{ sinceDateThreshold.slice(0, 10) }}...
         </p>

         <!-- Container for results: Show when not loading AND gists array is available (even if empty) -->
         <div v-if="!loading && gists">
             <!-- Table: Show the table structure always if gists is an array -->
             <table>
                 <thead>
                     <tr>
                         <th>Description</th>
                         <th>Files</th>
                         <th>Updated</th>
                         <th>Created</th>
                     </tr>
                 </thead>
                 <tbody>
                     <!-- Loop over the COMPUTED filteredGists -->
                     <tr v-for="gist in filteredGists" :key="gist.id">
                         <td>
                             <a :href="gist.html_url" target="_blank" rel="noopener noreferrer">
                                 {{ gist.description || '(No description)' }}
                             </a>
                         </td>
                         <td>
                             {{ gist.files ? Object.keys(gist.files).length : 0 }}
                         </td>
                         <td>
                             {{ gist.updated_at ? gist.updated_at.slice(0, 10) : 'N/A' }}
                         </td>
                         <td>
                             {{ gist.created_at ? gist.created_at.slice(0, 10) : 'N/A' }}
                         </td>
                     </tr>
                 </tbody>
             </table>

             <!-- Message if the FILTERED list is empty, but the original fetch wasn't empty -->
             <p v-if="filteredGists.length === 0 && gists.length > 0">
                 No gists found matching your filter criteria (and updated since {{ sinceDateThreshold.slice(0, 10) }}).
             </p>
             <!-- Message if the original fetch returned an empty list -->
             <p v-else-if="gists.length === 0">
                 No gists found updated since {{ sinceDateThreshold.slice(0, 10) }}.
             </p>
         </div>
      </div>
    </section>
  `,
};

export default Gists;
