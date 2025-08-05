import mitt from './emitter.js';

const { createApp } = Vue;

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue RightPanel créée");
  },
    data() {
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
        servicedata : {},
      }
    },
    methods: {
    // fonction de mise à jour des info de node/machine
    addOrUpdateMachine : function(machine) {
      this.nodedata = machine;
      this.showMenu1 = true;
      this.showMenu2 = false;
      this.showMenu3 = false;
    },
    // fonction de mise à jour des info de service
    addOrUpdateService : function(service) {
      this.service.data = service;
      this.showMenu1 = false;
      this.showMenu2 = true;
      this.showMenu3 = false;
    },
    // fonctions de trigger d'un getHealth API 
    checkAPI : function() {
      mitt.emitter.emit('check_health');
    },
    addNote : function() {
      this.showDialogNote = !this.showDialogNote;
    },
    addNoteValidate : function() {
      console.log("emit add note request");
      mitt.emitter.emit('request_scan', {"cible" : {}, 
                                              "titre" : this.titreNote,
                                              "texte" : this.texteNote, 
                                              'callScan' : 'request_add_note'});
      // on reset le dialog
      this.titreNote = "";
      this.texteNote = "";

    },
    exportGraph : function(typeexport) {
      mitt.emitter.emit('request_export', typeexport);
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
          mitt.emitter.emit('request_import_json', {'file' : data});
        }

        r.readAsBinaryString(f);
        document.getElementById('echo_json_upload').value = "";
      }
    },
    actionGraph : function(action) {
      mitt.emitter.emit('request_action_graph', action);
    },
  },
})