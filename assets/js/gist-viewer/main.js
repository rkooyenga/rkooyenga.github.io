/**
 * Main app module.
 */
import { createApp } from "https://unpkg.com/vue@3.2/dist/vue.esm-browser.js";
import FilterInput from "./FilterInput.js";
import Gists from "./Gists.js";

const USERNAME = "deadflowers";
const REPO_NAME = "gist-viewer";

const app = createApp({
  components: {
    Gists,
    FilterInput,
  },
  data() {
    return {
      username: USERNAME,
      filter: "",
    };
  },
  computed: {
    profileUrl() {
      return `https://github.com/${this.username}`;
    },
    repoUrl() {
      return `${this.profileUrl}/${REPO_NAME}`;
    },
    gistsUrl() {
      return `https://gist.github.com/${this.username}`;
    },
  },
  template: `

   
    <p>
      User: <a :href="profileUrl">@{{ username }} </a><a :href="gistsUrl">| Gist Site</a>
    </p>

    <h2>Recent Gists Smart Filter</h2><br>
    <FilterInput v-model="filter"></FilterInput>

    <br>

    <Gists id="gists-widget" :username="username" :filter="filter"></Gists>
  `,
});

app.mount("#app");
