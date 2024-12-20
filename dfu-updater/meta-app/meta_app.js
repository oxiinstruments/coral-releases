// New changes involve reading from sources.json to find the 'sources' we should pull from
// Those sources replace the previously hard coded 'examples.json' file, and should otherwise
// function the same.

// The changes should primarily only affect gatherExampleData

// When imported the examples will have the original data located in the .json file
// as well as the 'source' field containing the data structure used to find the example

var data = {
  platforms: [],
  examples: [],
  no_device: true,
  sel_example: null,
  firmwareFile: null,
  blinkFirmwareFile: null,
  bootloaderFirmwareFile: null,
  displayImportedFile: false,
  displaySelectedFile: false
}

FIRMWARE_URL = "../../dfu-updater/meta-firmware/"
// Global Buffer for reading files
var ex_buffer

// Gets the root url
// should be https://localhost:9001/Programmer on local
function getRootUrl() {
  var url = document.URL;
  return url;
}

// Reads the specified file containing JSON example meta-data
// function gatherExampleData()
// {
//     // Get Source list as data
//     var self = this // assign self to 'this' before nested function calls...
//     var src_url = getRootUrl().concat("data/sources.json")
//     var raw = new XMLHttpRequest();
//     raw.open("GET", src_url, true);
//     raw.responseType = "text"
//     raw.onreadystatechange = function ()
//     {
//         if (this.readyState === 4 && this.status === 200) {
//             var obj = this.response;
//             buffer = JSON.parse(obj);
//             buffer.forEach( function(ex_src) {
//                 // Launch another request with async function to load examples from the
//                 // specified urls
//                 // This will fill examples directly, and replace the importExamples/timeout situation.
//                 var ext_raw = new XMLHttpRequest();
//                 ext_raw.open("GET", ex_src.data_url, true);
//                 ext_raw.responseType = "text"
//                 ext_raw.onreadystatechange = function ()
//                 {
//                     if (this.readyState === 4 && this.status === 200) {
//                         // Now this.response will contain actual example data
//                         var ext_obj = this.response;
//                         ex_buffer = JSON.parse(ext_obj);
//                         // Now we could just fill the examples data
//                         // ex_buffer.forEach( function(ex_data) {
//                         //     console.log("%s - %s", ex_src.name, ex_data.name);
//                         // })
//                         const unique_platforms = [...new Set(ex_buffer.map(obj => obj.platform))]
//                         // This needs to be fixed to 'ADD' examples
//                         //self.examples = data
//                         self.examples.push(ex_buffer)
//                         var temp_platforms = self.platforms.push(unique_platforms)

//                         const new_platforms = [...new Set(temp_platforms.map(obj => obj))]
//                         self.platforms = new_platforms
//                     }
//                 }
//                 ext_raw.send(null)

//                     // var self = this
//                     // const unique_platforms = [...new Set(data.map(obj => obj.platform))]
//                     // self.examples = data
//                     // self.platforms = unique_platforms
//             })
//         }
//     }
//     raw.send(null)
// }


function displayReadMe(fname) {
  var srcurl = FIRMWARE_URL
  //var expath = srcurl.substring(0, srcurl.lastIndexOf("/") +1).extend;
  var url = srcurl.concat(self.data.sel_example.url)


  fname = fname.substring(5, fname.length - 4);

  div = document.getElementById("readme")

  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, language) {
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
      return hljs.highlight(validLanguage, code).value;
    },
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
  });


  fetch(url)
    .then(response => response.text())
    .then(text => div.innerHTML = marked.parse(text.replace("404: Not Found", "No additional details available for this example.")));
}

async function readServerFirmwareFile(path, dispReadme = true) {
  return new Promise((resolve) => {
    var buffer
    var raw = new XMLHttpRequest();
    var fname = path;

    if (dispReadme) {
      displayReadMe(fname)
    }
    raw.open("GET", fname, true);
    raw.responseType = "arraybuffer"
    raw.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        resolve(this.response)
      }
    }
    raw.send(null)
  })
}

var app = new Vue({
  el: '#app',
  template: `
  <b-container class="app_body">
  <div align="center">
      <button id="detach" disabled="true" hidden="true">Detach DFU</button>
      <button id="upload" disabled="true" hidden="true">Upload</button>
      <b-form id="configForm">
          <p> <label for="transferSize" hidden="true">Transfer Size:</label>
              <input type="number" name="transferSize" hidden="true" id="transferSize" value="1024"></input>
          </p>

          <p><label hidden="true" for="vid">Vendor ID (hex):</label>
              <input hidden="true" list="vendor_ids" type="text" name="vid" id="vid" maxlength="6" size="8"
                  pattern="0x[A-Fa-f0-9]{1,4}">
              <datalist id="vendor_ids"> </datalist>
          </p>

          <div id="dfuseFields" hidden="true">
              <label for="dfuseStartAddress" hidden="true">DfuSe Start Address:</label>
              <input type="text" name="dfuseStartAddress" id="dfuseStartAddress" hidden="true"
                  title="Initial memory address to read/write from (hex)" size="10" pattern="0x[A-Fa-f0-9]+">
              <label for="dfuseUploadSize" hidden="true">DfuSe Upload Size:</label>
              <input type="number" name="dfuseUploadSize" id="dfuseUploadSize" min="1" max="2097152" hidden="true">
          </div>
      </b-form>
  </div>

  <b-row align="center">
      <b-col align="center" class="app_column">
          <legend>1. Connect to META using a <b>Chrome or Opera browser</legend>
          <br>
          <p><b-button variant="dfu" id="connect"> Connect</b-button></p>
          <dialog id="interfaceDialog">
              Your device has multiple DFU interfaces. Select one from the list below:
              <b-form id="interfaceForm" method="dialog">
                  <b-button id="selectInterface" type="submit">Select interface</b-button>
              </b-form>
          </dialog>
          <div id="usbInfo" hidden="true" style="white-space: pre"></div>
          <div id="dfuInfo" hidden="true" style="white-space: pre"></div>
          <p> <span id="status"></span> </p>
          <p>If this is your first time here, follow the steps in "Update Instructions" </p>
      </b-col>
  </b-row>

  <b-row align="center">
      <b-col align="center" class="app_column">
          <b-container>
              <!--b-row class="p-2">
                  <legend>Upload the latest firmware</legend>
                  <div><b-button variant="es" id="latest"  :disabled="no_device">Upload latest firmware!</b-button></div>
              </b-row-->
              <b-row class="p-2">
                  <legend>2. Select a firmware from the list</legend>
                  <b-form-select v-model="sel_example" id="firmwareSelector" required @change="programChanged">
                      <template v-slot:first>
                          <!--b-form-select-option :value="null" disabled>-- Example --</b-form-select-option-->
                      </template>
                      <b-form-select-option v-for="example in platformExamples" v-bind:key="example.name"
                          :value="example">{{example.name}}</b-form-select-option>
                  </b-form-select>
              </b-row>
              <br>
              <div>
                  <div id="readme"></div>
              </div>
          </b-container>
      </b-col>
  </b-row>

  <b-row align="center">
      <b-col align="center" class="app_column">
          <b-container>
              <legend>3. Press program to upload the firmware</legend>
              <br>
              <b-button id="download" variant='es' :disabled="no_device || !sel_example"> Program</b-button>
              <br>
              <div class="log" id="downloadLog"></div>
              <br>
          </b-container>
      </b-col>
  </b-row>

  <b-row>
      <b-col align="center" class="app_column">
          <b-container align="center">
              <p>Or select a .bin file from your computer</p>
              <b-row class="p-2">
                  <legend> </legend>
                  <b-form-file id="firmwareFile" v-model="firmwareFile" :state="Boolean(firmwareFile)"
                      placeholder="Choose or drop a file..." drop-placeholder="Drop file here..."></b-form-file>
              </b-row>
              </div>
          </b-container>
      </b-col>
  </b-row>
</b-container>
    `,
  data: data,
  computed: {
    platformExamples: function () {

      return this.examples
    }
  },
  created() {
    console.log("Page Created")
  },
  mounted() {
    var self = this
    console.log("Mounted Page")
    //var fpath = getRootUrl().concat("bin/examples.json");
    //gatherExampleData()
    // setTimeout(function(){
    //     self.importExamples(buffer)
    // }, 1000)
    this.importExamples()
  },
  methods: {
    importExamples() {
      // var self = this
      // const unique_platforms = [...new Set(data.map(obj => obj.platform))]
      // self.examples = data
      // self.platforms = unique_platforms
      // New code below:
      // Get Source list as data
      // var self = this // assign self to 'this' before nested function calls...
      // fetch('https://api.github.com/repos/oxiinstruments/meta-releases/releases/latest')
      //   .then(response => response.json())
      //   .then(data => {
      //     // The JSON data is now available in the 'data' variable
      //     // console.log(data.name);
      //     // var srcurl = data.assets[0].browser_download_url;
      //     var tag_name = data.tag_name;
      //     var srcurl = "/dfu-updater/meta-firmware/" + data.assets[0].name + "?" + tag_name;
      //     console.log("release: " + data.name);
      //     console.log("url: " + srcurl);

      //     readServerFirmwareFile(srcurl, false).then(buffer => {
      //       firmwareFile = buffer
      //     })
      //   })
      //   .catch(error => {
      //     // Handle any errors that occur during the fetch request
      //     console.error(error);
      //   });
      var self = this // assign self to 'this' before nested function calls...
      // Launch another request with async function to load examples from the 
      // specified urls 
      // This will fill examples directly, and replace the importExamples/timeout situation.
      var src_url =  FIRMWARE_URL + "/firmware_list.json?v=" + new Date().getTime(); //need to strip out query string

      var ext_raw = new XMLHttpRequest();
      ext_raw.open("GET", src_url, true);
      ext_raw.responseType = "text"
      ext_raw.onreadystatechange = function () {
        // This response will contain example data for the specified source.
        if (this.readyState === 4 && this.status === 200) {
          var ext_obj = this.response;


          ex_buffer = JSON.parse(ext_obj);
          const unique_platforms = [...new Set(ex_buffer.map(obj => obj.platform))]
          ex_buffer.forEach(function (ex_dat) {
            //  Add "source" to example data
            // ex_dat.source = ex_src

            // self.examples.sort(function (i1, i2) {
            //   return i1.name.toLowerCase() < i2.name.toLowerCase() ? -1 : 1
            // })
            self.examples.push(ex_dat)
          })
        }
      }
      ext_raw.send(null)
    },
    programChanged() {
      var self = this

      // Read new file
      self.firmwareFileName = self.sel_example.name
      this.displaySelectedFile = true;
      var srcurl = FIRMWARE_URL
      //var expath = srcurl.substring(0, srcurl.lastIndexOf("/") +1).extend;
      var expath = srcurl.concat(self.sel_example.filepath)
      console.log(self.sel_example.description);
      readServerFirmwareFile(expath).then(buffer => {
        firmwareFile = buffer
      })
    },
  },
  watch: {
    firmwareFile(newfile) {
      firmwareFile = null;
      this.displaySelectedFile = true;
      // Create dummy example struct
      // This updates sel_example to enable the Program button when a file is loaded
      var new_example = {
        name: newfile.name,
        description: "Imported File",
        filepath: null,
        platform: null
      }
      this.sel_example = new_example;
      let reader = new FileReader();
      reader.onload = function () {
        this.firmwareFile = reader.result;
        firmwareFile = reader.result;
      }
      reader.readAsArrayBuffer(newfile);
    },
    examples() {
      var self = this

      //grab the blink firmware file

      //parse the query strings
      var searchParams = new URLSearchParams(getRootUrl().split("?")[1])

      if (self.sel_example != null) {
        // self.sel_example = self.examples
        this.programChanged()
      }
    }
  }
})
