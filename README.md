# Echosounder :anchor:

## Présentation 

Echosounder est un explorateur de réseau local proposant une visualisation par graphe.

Le cycle du pentest est généralement composé de 5 phases : 
 - Reconnaissance.
 - Intrusion.
 - Élévation de privilège.
 - Persistence.
 - Exfiltration de données sensibles.

Echosounder se place dans la phase de reconnaissance de ce cycle, en proposant une fois un accès à un réseau privé obtenu, la possibilité de l'explorer, et de sortir une visualisation dudit réseau.

## Screenshots

![example_scan](./doc/img/example.png)


### Ce que Echosounder permet

 - Effectuer des scans d'un réseau local.
 - Obtenir une vue claire des réseaux locaux & distants liés à ce réseau local.
 - Identifier des machines sur les réseaux.
 - Identifier des services sur ces machines.
 - Avoir l'ensemble des machines et des réseaux affichés sur un graphe.
 - Avoir l'ensemble des données de machines et de réseaux dans un panel "data".
 - Exporter les graphs en JSON.
 - Importer les graphs en JSON.

### Ce que Echosounder n'est pas

 - Un remplaçant à nmap (Echosounder utilise nmap comme dépendance).
 - Un logiciel de "management des asset" (Echosounder ne propose que de la visualisation).
 - Un logiciel de "vulnerability assessement" (Echosounder identifie des services via nmap, mais ne vérifie pas les vulnérabilités).

## Installation

### Dépendances
 
 - nmap (https://nmap.org/)
 - Scapy (https://scapy.net/)
 - Impacket (https://github.com/SecureAuthCorp/impacket)
 - dnspython (https://www.dnspython.org/)

### Installation 

```bash
git clone https://github.com/darcosion/Echosounder
cd Echosounder
sudo apt install nmap
sudo pip3 install -r requirements.txt
# mise à jour de la base de données CIDR -> AS
python3 asinfo/collectas.py
# mise à jour de la base de données MAC -> OUI
python3 ouiinfo/collectoui.py
```
### Lancement 

```bash
sudo ./webchosounder.py
```

## Développement & Architecture

Echosounder est une application web relativement statique.

Il n'y a pas de base de donnée, juste un serveur Flask servant des fichiers statiques, une API permettant d'atteindre des fonctions de traceroute et de construction de paquet divers et coté front une foule de lib JS permettant de proposer une interface graphique agréable et intéressante.

Au niveau du backend, plusieurs particularités intéressantes sont à noter : 
    - un chemin d'API "Health" permet de rendre compte de l'état du backend et cherche à confirmer la présence et l'usage de l'ensemble des dépendances du backend, ainsi que l'état du réseau. C'est en quelque sorte, un miniset de tests unitaires lancés à chaque démarrage de page sur l'application. 
    - Les fonctions de recherche sont divers et peuvent faire appels à pleins de dépendances pour le forgeage réseau come scapy, impacket, nmap ou encore DNSPython
    - Il existe un sous-set de fonction qui servent à la résolution d'information hors-ligne, principalement les IP et les adresses MAC. Elles font appels à des fichier locaux qu'il faut télécharger à l'avance. Cela permet de travailler en hors-connexion sur un réseau et de bien visualiser ce qui est dessus. 
    - une fonction d'API simple est fournit pour donner une SPA (Single Page Application) qui est le système de visualisation

Pour le front-end, également quelques points intéressants : 
    - J'aime particulièrement les framework qui proposent une logique modulaire ou par composant. Historiquement, AngularJS 1 était mon favoris car il me permettait de séparer logiquement la plupart des fonctions du système. Je suis en train de progressivement tout basculer sur VueJS qui propose une logique d'applications séparés qui semble convenir et remplacer AngularJS dont la version 2 de Google ne me satisfait plus du tout.
    - Tout est en VanillaJS avec de l'ESM également par confort personnel, je n'aime pas le typescript et les logiques de transpilation en JS que cela impose.
    - Les applications vueJS séparent logiquement les éléments visuels dans la SPA. ce qui signifie que chaque menu est une application, le graph est une application et le système de notification est une application. Cela permet de répartir dans pleins de fichier différents chaque application dans la SPA et de déterminer rapidement où est exécuté quoi
    - Pour la visualisation par graph, Cytoscape est utilisé, cette lib JS a la particularité de proposer une vue graph très maniable, mais permet également un export et un import simple en JSON. Ce qui permet de travailler sur de multiples graph de manière très propre
    - Au niveau du CSS, il y a un gros travail effectué sur les palettes de couleur customisées, notamment avec une fonction permettant de choisir sa propre palette de couleur et de l'imposer sur l'ensemble de l'interface.

Au niveau de l'organisation du projet : 
 - A peu près tout fonctionne sous la forme d'issue (feature, bug, choix d'architecture, documentation), il n'y a quasiment aucune automatisation pour le moment. Mais tout le monde est le bienvenu dans les issues
 - Il existe quelques issues épinglés qui sont des choix d'architecture importants. Ils constituent pour ainsi dire les fondamentaux de l'application sont régulièrement cités pour justifier ou modifier de futurs choix d'architectures (bien qu'avec le temps, ils tendent à devenir implicites...)