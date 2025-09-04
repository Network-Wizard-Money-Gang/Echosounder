import mitt from './emitter.js';
import {useStore} from './store.js';

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue RightPanel créée");
  },
    data() {
      let store = useStore();
      return {
        // ici on ajoute les variables manipulables du graph
        showMenu1 : false,
        showMenu2 : false,
        showMenu3 : false,
        // variable d'affichage du menu d'ajout de note
        showDialogNote : false,
        // variables de notes
        titreNote : "",
        texteNote : "",
        // variable d'info sur machine
        nodedata : {},
        // variable d'info sur service
        servicedata : store.servicedata,
        store : store,
      }
    },
    methods: {
    // fonction de mise à jour des info de node/machine
    addOrUpdateMachine : function(machine) {
      this.store.nodedata = machine;
      this.showMenu1 = true;
      this.showMenu2 = false;
      this.showMenu3 = false;
    },
    // fonction de mise à jour des info de service
    addOrUpdateService : function(service) {
      this.store.servicedata = service;
      this.showMenu1 = false;
      this.showMenu2 = true;
      this.showMenu3 = false;
    },
    // fonctions de trigger d'un getHealth API 
    checkAPI : function() {
      this.store.EchoSounderApp.getHealth();
    },
    addNote : function() {
      this.showDialogNote = !this.showDialogNote;
    },
    addNoteValidate : function() {
      console.log("emit add note request");
      this.store.graphNetworkApp.addNote(this.store.nodesSelected, this.titreNote, this.texteNote);
      // on reset le dialog
      this.titreNote = "";
      this.texteNote = "";

    },
    deleteIPSelected : function(ip) {
      let index = this.store.nodesSelected.indexOf(ip);
      if(index != -1) {
        this.store.nodesSelected.splice(index, 1);
      }
    },
    exportGraph : function(typeexport) {

      this.store.graphNetworkApp.exportGraph(typeexport);
    },
    importJSON : function() {
      if(document.getElementById('echo_json_upload').files.length == 0) {
        document.getElementById('echo_json_upload').click();
      }else {
        let f = document.getElementById('echo_json_upload').files[0],
            r = new FileReader();

        r.onloadend = function(e) {
          let data = e.target.result;
          // On envoie le fichier
          this.store.graphNetworkApp.importJson({'file' : data});
        }

        r.readAsBinaryString(f);
        document.getElementById('echo_json_upload').value = "";
      }
    },
    actionGraph : function(action) {
      this.store.graphNetworkApp.actionGraph(action);
    },
    // fonction de reset du panel : 
    resetPanel : function() {
      this.showMenu1 = false;
      this.showMenu2 = false;
      this.showMenu3 = false;
    }
  },
})