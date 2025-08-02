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
  watch : {
    listToast : {
      handler : function(newListToast, oldListToast) {
        console.log(newListToast);
        if(newListToast.length == 0) {
          // on ne fait rien
        }else {
          // place un delay de 3 secondes plus on efface le premier élément de la liste
          setTimeout(() => { this.listToast = this.listToast.slice(1);}, 7000);
        }
      }, 
      deep : true,
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
    },
    errorToast: function(toastData) {
      this.listToast.push({
        'titre' : 'error', 
        'texte' : toastData,
        'className' : 'echo_toast_error',
      });
    }
  },
})