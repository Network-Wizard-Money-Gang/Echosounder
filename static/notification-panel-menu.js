import mitt from './emitter.js';

const { createApp } = Vue;

export default Vue.createApp({

  mounted() {
    //lancement de la fonction de création du flux de toast
    mitt.emitter.emit('parent', "AppVue Toast notification créée");
  },
	data() {
	  return {
        // ici on ajoute les variables manipulables du flux de Toast
        listToast: [],
	  }
	},
	methods: {
    // fonctions d'insertion de nouveau Toast dans la liste 
    infoToast: function(toastData) {
      this.listToast.push({
        'titre' : 'info', 
        'texte' : toastData,
        'className' : 'echo_toast_info',
      });
      console.log(this.listToast);
    }
  },
})