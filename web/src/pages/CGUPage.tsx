import { PageShell } from '@/components/layout/PageShell'
import { LegalArticle as Article, ToValidate } from '@/components/layout/LegalArticle'

export function CGUPage() {
  return (
    <PageShell
      title="Conditions générales d'utilisation"
      description="Version de travail - V2.0 · Septembre 2026 · Document soumis à validation juridique."
    >
      <div className="flex max-w-prose flex-col gap-6">
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <p>Projet pédagogique - Ministère du Job et Bonheur, Direction Numérique et Innovation.</p>
          <p>Référence du cahier des charges : JEB/DNI/2026-001.</p>
          <p className="mt-2 font-medium text-foreground">
            Démonstrateur technique, ne constitue pas un service public en exploitation.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Les présentes CGU constituent un projet rédigé dans le cadre du développement de
          GéoEmploi. Elles décrivent le fonctionnement et les règles d'utilisation du service
          tel qu'il est effectivement implémenté. Les éléments identifiés « à valider » restent
          soumis à validation juridique avant toute mise en production.
        </p>

        <Article number="1" title="Objet">
          <p>
            Les présentes Conditions Générales d'Utilisation, ci-après les « CGU », définissent
            les conditions d'accès et d'utilisation de GéoEmploi.
          </p>
          <p>
            GéoEmploi est une application web développée dans le cadre de la politique nationale
            d'emploi portée par le Ministère du Job et Bonheur. Elle vise à améliorer la mise en
            relation entre demandeurs d'emploi et employeurs sur le territoire national, au moyen
            de fonctionnalités de recherche d'offres géolocalisées sur une carte interactive. Elle
            complète les dispositifs existants sans s'y substituer.
          </p>
          <p>
            Le Service permet aux demandeurs d'emploi de créer et gérer un profil professionnel,
            rechercher et consulter des offres sur une carte, utiliser leur position pour
            rechercher des offres à proximité, déposer des candidatures accompagnées de documents
            et suivre leurs candidatures.
          </p>
          <p>
            Il permet aux employeurs de créer un compte professionnel, renseigner leur
            entreprise, publier et gérer des offres géolocalisées, recevoir et gérer les
            candidatures reçues et consulter un tableau de bord de suivi.
          </p>
          <p>
            Il permet à l'administration de modérer les offres publiées, de traiter les
            signalements, de gérer les comptes utilisateurs et de consulter des métriques
            d'usage.
          </p>
        </Article>

        <Article number="2" title="Définitions">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li><strong>« GéoEmploi »</strong> désigne l'application web et ses fonctionnalités.</li>
            <li><strong>« Service »</strong> désigne l'ensemble des fonctionnalités proposées.</li>
            <li><strong>« Utilisateur »</strong> désigne toute personne utilisant le Service, avec ou sans compte.</li>
            <li><strong>« Visiteur »</strong> désigne un Utilisateur non connecté.</li>
            <li><strong>« Candidat »</strong> désigne un Utilisateur titulaire d'un compte demandeur d'emploi.</li>
            <li><strong>« Employeur »</strong> désigne un Utilisateur titulaire d'un compte employeur, publiant des offres et gérant les candidatures reçues.</li>
            <li><strong>« Administrateur »</strong> désigne un compte habilité aux fonctions de modération et de gestion des comptes.</li>
            <li><strong>« Offre »</strong> désigne une annonce d'emploi publiée sur GéoEmploi.</li>
            <li><strong>« Candidature »</strong> désigne une candidature déposée par un Candidat auprès d'un Employeur, le cas échéant accompagnée de documents.</li>
            <li><strong>« Signalement »</strong> désigne le signalement par un Utilisateur connecté d'une offre qu'il estime frauduleuse ou non conforme.</li>
            <li><strong>« Géolocalisation »</strong> désigne l'utilisation temporaire de la position géographique du terminal afin de faciliter la recherche d'offres à proximité.</li>
          </ul>
        </Article>

        <Article number="3" title="Acceptation des CGU">
          <p>
            L'utilisation de GéoEmploi implique l'acceptation des présentes CGU. Lorsqu'une
            fonctionnalité nécessite la création d'un compte, l'Utilisateur doit accepter les
            CGU dans les conditions prévues par l'application.
          </p>
          <p>
            L'Utilisateur qui refuse les CGU ne peut accéder aux fonctionnalités nécessitant
            leur acceptation. La consultation des offres sur la carte reste accessible sans
            compte.
          </p>
          <ToValidate>modalités techniques précises d'acceptation des CGU lors de la création d'un compte.</ToValidate>
        </Article>

        <Article number="4" title="Accès au Service">
          <p>
            GéoEmploi est accessible depuis un navigateur web compatible, sur ordinateur ou
            terminal mobile. L'application est conçue comme une application web responsive.
          </p>
          <p>
            L'Utilisateur doit disposer d'un équipement et d'une connexion Internet permettant
            l'accès au Service. Les éventuels frais liés à Internet, au réseau mobile ou au
            terminal restent à sa charge.
          </p>
          <p>
            La consultation des offres sur la carte ne nécessite aucun compte. Un Visiteur peut
            consulter la carte, ouvrir une offre et en lire le détail. La candidature, la
            publication d'une offre, le signalement et les fonctions d'administration nécessitent
            un compte authentifié disposant du rôle correspondant.
          </p>
        </Article>

        <Article number="5" title="Création et gestion du compte">
          <p>
            Certaines fonctionnalités nécessitent la création d'un compte. L'Utilisateur fournit
            les informations demandées et s'engage à fournir des informations exactes et à jour.
          </p>
          <p>
            Un compte est associé à une adresse e-mail unique, à un rôle utilisateur et à un mot
            de passe. Les mots de passe sont conservés uniquement sous forme hachée et ne sont
            jamais stockés en clair.
          </p>
          <p>
            Le rôle est choisi à l'inscription entre demandeur d'emploi et employeur. Le rôle
            administrateur ne peut pas être obtenu par inscription : il est attribué en dehors du
            parcours public.
          </p>
          <p>
            L'Utilisateur est responsable de la confidentialité de ses identifiants et doit
            prendre les mesures nécessaires pour empêcher leur utilisation non autorisée. En cas
            de suspicion d'accès frauduleux, il doit contacter l'équipe responsable de GéoEmploi
            selon les modalités indiquées par le Service.
          </p>
        </Article>

        <Article number="6" title="Utilisation du Service par les Candidats">
          <p>
            Le Candidat peut créer un profil professionnel destiné à faciliter sa recherche
            d'emploi et ses candidatures. Le profil peut comporter le nom, le prénom, les
            compétences, l'expérience professionnelle et la date de disponibilité.
          </p>
          <p>
            Le Candidat est responsable de l'exactitude des informations renseignées et peut les
            modifier. Les informations nécessaires au traitement d'une candidature sont
            transmises à l'Employeur concerné lorsque la candidature est déposée auprès de
            celui-ci.
          </p>
        </Article>

        <Article number="7" title="Utilisation du Service par les Employeurs">
          <p>
            L'Employeur peut créer un compte professionnel afin de publier des offres
            géolocalisées et de gérer les candidatures reçues. Les informations peuvent
            comprendre le nom de l'entreprise, une description, un numéro de téléphone et des
            coordonnées de contact.
          </p>
          <p>
            L'Employeur garantit l'exactitude des informations renseignées et disposer des
            droits nécessaires pour représenter l'organisation indiquée.
          </p>
          <p>
            Le compte employeur comporte un indicateur de vérification d'activité, prévu par le
            cahier des charges. Cet indicateur est renseigné par l'administration ; la présence
            d'un compte employeur sur GéoEmploi ne vaut pas certification de l'organisation.
          </p>
          <ToValidate>procédure et pièces justificatives de la vérification d'activité et d'identité des employeurs.</ToValidate>
        </Article>

        <Article number="8" title="Recherche et consultation des offres">
          <p>
            GéoEmploi permet de rechercher et consulter des offres d'emploi sur une carte
            interactive. Une offre présente un intitulé, une description, un type de contrat, le
            cas échéant une durée, un mode de travail (sur site, hybride ou à distance), un temps
            de travail, une adresse, une commune et une localisation géographique.
          </p>
          <p>
            La localisation permet l'affichage sur la carte. Les informations de localisation
            sont générées à partir de l'adresse renseignée par l'Employeur et traitées par un
            service de géocodage tiers (voir article 21).
          </p>
          <p>
            La localisation affichée constitue une aide à la recherche et peut être affectée par
            une erreur ou une imprécision. La précision géographique visée correspond à la
            commune ou à l'arrondissement.
          </p>
          <p>
            Une offre déclarée intégralement à distance ne porte pas de localisation et
            n'apparaît donc pas sur la carte, tout en restant consultable.
          </p>
        </Article>

        <Article number="9" title="Géolocalisation de l'Utilisateur">
          <p>
            GéoEmploi peut proposer l'utilisation de la géolocalisation du terminal afin de
            faciliter la recherche d'offres à proximité. Cette fonctionnalité est facultative et
            repose sur le mécanisme d'autorisation du navigateur.
          </p>
          <p>
            Lorsque l'Utilisateur autorise l'accès à sa position, celle-ci est utilisée
            temporairement pour centrer la carte et rechercher les offres proches. La position
            GPS personnelle de l'Utilisateur n'est jamais enregistrée en base de données.
          </p>
          <p>
            Aucun historique permanent des déplacements n'est constitué. En cas de refus,
            l'Utilisateur peut continuer à utiliser le Service au moyen d'une recherche reposant
            sur la saisie manuelle d'une commune. Le refus ou le retrait de l'autorisation
            n'entraîne pas la suppression du compte, du profil ou des candidatures.
          </p>
          <ToValidate>base légale définitive et formulation exacte de l'information présentée avant l'autorisation.</ToValidate>
        </Article>

        <Article number="10" title="Publication et durée de vie des offres">
          <p>
            Les Employeurs peuvent publier des offres au moyen des fonctionnalités proposées.
            L'Employeur est responsable du contenu publié et s'engage à fournir des informations
            exactes, respecter les règles applicables au recrutement, ne pas publier de contenu
            illicite, discriminatoire ou trompeur, renseigner une localisation correspondant au
            lieu concerné et disposer des droits nécessaires sur les contenus.
          </p>
          <p>
            Une offre est automatiquement archivée trente jours après sa publication. Une offre
            archivée n'apparaît plus sur la carte et n'accepte plus de nouvelle candidature. Elle
            reste visible par l'Employeur qui l'a publiée, signalée comme archivée, ainsi que par
            les Candidats qui y ont postulé au titre du suivi de leur candidature.
          </p>
          <p>
            GéoEmploi peut procéder à des contrôles ou à une modération. Une offre peut être
            retirée ou désactivée lorsqu'elle est manifestement illégale, frauduleuse, contraire
            aux CGU, porte atteinte aux droits d'un tiers ou compromet la sécurité du Service.
          </p>
        </Article>

        <Article number="11" title="Candidatures">
          <p>
            Lorsqu'il est connecté avec un compte demandeur d'emploi, un Candidat peut déposer
            une candidature à partir d'une offre non archivée. Une seule candidature peut être
            déposée par Candidat et par offre.
          </p>
          <p>
            La candidature comporte les nom et prénom du Candidat, le cas échéant un numéro de
            téléphone et un message, ainsi qu'un curriculum vitæ obligatoire et une lettre de
            motivation facultative. Les coordonnées saisies sur le formulaire sont enregistrées
            avec la candidature indépendamment du profil : une modification ultérieure du profil
            ne modifie pas une candidature déjà envoyée.
          </p>
          <p>
            Les documents transmis doivent être au format PDF, DOC ou DOCX et ne pas dépasser 5
            Mo par fichier. Le renvoi d'un document du même type remplace le précédent.
          </p>
          <p>
            Le dépôt entraîne la transmission à l'Employeur concerné des informations et
            documents nécessaires au traitement de la candidature. La candidature porte un
            statut, une date de dépôt et une date de mise à jour.
          </p>
          <p>
            Le Candidat peut consulter le suivi de ses candidatures. L'Employeur peut consulter
            les candidatures reçues pour ses offres et en modifier le statut.
          </p>
          <p>
            Le cahier des charges prévoit qu'une notification soit adressée à l'Employeur à
            chaque nouvelle candidature. Cette fonctionnalité n'est pas active dans la présente
            version ; l'Employeur consulte les candidatures reçues depuis son tableau de bord.
          </p>
          <p>
            GéoEmploi constitue un outil de mise en relation et ne garantit pas l'obtention d'un
            entretien ou d'un emploi.
          </p>
        </Article>

        <Article number="12" title="Signalement des offres">
          <p>
            Tout Utilisateur connecté peut signaler une offre qu'il estime frauduleuse, non
            conforme, expirée ou problématique pour un autre motif, en précisant le cas échéant
            un commentaire. Un même compte ne peut signaler qu'une seule fois la même offre.
          </p>
          <p>
            Les signalements sont transmis à l'administration, qui les examine et leur attribue
            une suite. Un signalement peut donner lieu au retrait de l'offre, à un avertissement
            adressé au compte concerné ou à un classement sans suite.
          </p>
          <p>
            Le signalement ne doit pas être détourné de sa finalité. Un signalement manifestement
            abusif ou répété de mauvaise foi peut lui-même donner lieu aux mesures prévues à
            l'article 18.
          </p>
        </Article>

        <Article number="13" title="Obligations des Utilisateurs">
          <p>
            Tout Utilisateur s'engage à respecter les CGU, les lois et réglementations
            applicables, les droits des autres Utilisateurs et les règles de sécurité.
          </p>
          <p>
            Il est notamment interdit de fournir volontairement de fausses informations, usurper
            une identité, utiliser le compte d'un tiers sans autorisation, publier des offres
            fictives ou trompeuses, utiliser le Service à des fins frauduleuses, publier des
            contenus illicites, discriminatoires ou haineux, collecter massivement des données
            sans autorisation, contourner les mécanismes de sécurité, perturber le Service,
            introduire un programme malveillant ou utiliser abusivement ses fonctionnalités.
          </p>
        </Article>

        <Article number="14" title="Responsabilité des Employeurs">
          <p>
            Conformément au cahier des charges, les offres publiées engagent la responsabilité
            de l'Employeur. Les Employeurs sont seuls responsables des offres qu'ils publient. La
            présence d'une offre sur GéoEmploi ne constitue pas une validation, une certification
            ou une recommandation de l'offre ou de l'Employeur.
          </p>
          <p>
            GéoEmploi ne garantit pas l'existence réelle du poste, sa disponibilité, l'exactitude
            des informations, les conditions proposées, la conclusion d'un contrat de travail ou
            la fiabilité de l'Employeur. L'Utilisateur est invité à effectuer les vérifications
            nécessaires avant toute relation professionnelle, et à signaler toute offre suspecte
            au moyen du dispositif prévu à l'article 12.
          </p>
        </Article>

        <Article number="15" title="Responsabilité des Candidats">
          <p>
            Le Candidat est responsable des informations communiquées dans son profil et ses
            candidatures. Il s'engage à transmettre des informations exactes et à disposer des
            droits nécessaires sur les contenus et documents transmis.
          </p>
          <p>
            L'Employeur est responsable de l'utilisation des informations et documents reçus dans
            le cadre des candidatures et doit respecter les obligations qui lui sont applicables,
            notamment en matière de protection des données et de non-discrimination à
            l'embauche.
          </p>
        </Article>

        <Article number="16" title="Données personnelles">
          <p>
            L'utilisation de GéoEmploi implique le traitement de données personnelles, notamment
            pour la création et la gestion des comptes, les profils candidats et employeurs, les
            offres, les candidatures et leurs documents, la recherche géolocalisée, les
            signalements, l'authentification et la sécurité du Service.
          </p>
          <p>
            La position GPS personnelle de l'Utilisateur n'est pas conservée en base de données.
            Le nombre de consultations d'une offre est comptabilisé pour le tableau de bord de
            l'Employeur ; ce compteur n'enregistre aucune information sur le visiteur.
          </p>
          <p>GéoEmploi ne prévoit aucune vente ni transmission publicitaire des données personnelles.</p>
          <p>
            Les informations détaillées relatives aux traitements, aux catégories de données, aux
            durées de conservation et aux droits des personnes figurent dans la fiche de registre
            RGPD associée au Service.
          </p>
        </Article>

        <Article number="17" title="Droits des personnes et suppression du compte">
          <p>
            Conformément aux dispositions applicables, les personnes concernées disposent d'un
            droit d'accès, de rectification, d'effacement, de limitation, d'opposition lorsque
            celui-ci est applicable, et du droit de retirer leur consentement lorsqu'un
            traitement repose sur celui-ci.
          </p>
          <p>
            L'Utilisateur peut supprimer son compte depuis l'application. La suppression entraîne
            l'effacement du compte et des données rattachées : profil, offres publiées,
            candidatures déposées ou reçues, et documents transmis, y compris les fichiers
            stockés. Cette suppression est définitive, sous réserve des obligations légales de
            conservation applicables.
          </p>
          <p>
            Le retrait du consentement à la géolocalisation et la suppression du compte sont deux
            opérations distinctes : le retrait du consentement n'entraîne ni suppression du
            compte, ni perte du profil ou des candidatures.
          </p>
          <ToValidate>
            identité du responsable de traitement, coordonnées de contact, procédure d'exercice
            des droits, modalités d'identification du demandeur et délais de traitement.
          </ToValidate>
        </Article>

        <Article number="18" title="Modération, suspension et suppression d'un compte">
          <p>
            En cas de non-respect des CGU, GéoEmploi peut prendre les mesures nécessaires à la
            protection du Service et de ses Utilisateurs : suppression ou désactivation d'une
            offre, avertissement adressé au compte concerné, suspension temporaire d'un compte,
            limitation de fonctionnalités ou suppression d'un compte lorsque celle-ci est
            justifiée.
          </p>
          <p>
            Lorsque cela est possible et approprié, l'Utilisateur est informé du motif de la
            mesure. Les mesures relatives aux données personnelles sont mises en œuvre
            conformément aux règles applicables.
          </p>
          <ToValidate>échelle des sanctions, voies de recours de l'Utilisateur et délais.</ToValidate>
        </Article>

        <Article number="19" title="Sécurité">
          <p>
            GéoEmploi met en œuvre des mesures techniques et organisationnelles destinées à
            assurer la sécurité du Service et des données traitées :
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>hachage des mots de passe ;</li>
            <li>authentification par jeton transporté dans un cookie inaccessible aux scripts (HTTP-only) ;</li>
            <li>contrôle des accès selon les rôles, appliqué côté serveur et non seulement dans l'interface ;</li>
            <li>séparation des droits entre demandeur d'emploi, employeur et administrateur ;</li>
            <li>contraintes d'intégrité en base de données ;</li>
            <li>
              contrôle du type et de la taille des fichiers transmis, et génération du nom de
              stockage côté serveur, afin qu'un nom de fichier ne puisse pas être utilisé pour
              accéder à d'autres emplacements ;
            </li>
            <li>absence de secrets applicatifs dans le code source.</li>
          </ul>
          <p>
            L'Utilisateur doit également contribuer à la sécurité du Service en protégeant ses
            identifiants. Aucun système informatique ne peut garantir une sécurité absolue.
          </p>
        </Article>

        <Article number="20" title="Disponibilité du Service">
          <p>
            GéoEmploi est fourni dans la mesure des capacités techniques de l'infrastructure
            utilisée. Le Service peut être temporairement interrompu ou limité en cas de
            maintenance, mise à jour, incident technique, défaillance d'un service nécessaire ou
            événement indépendant de la volonté de l'équipe responsable.
          </p>
          <p>GéoEmploi ne garantit pas une disponibilité permanente ou ininterrompue.</p>
          <ToValidate>niveau d'engagement éventuel concernant la disponibilité et les performances.</ToValidate>
        </Article>

        <Article number="21" title="Cartographie, géocodage et services tiers">
          <p>Certaines fonctionnalités reposent sur des services techniques tiers :</p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Service</th>
                  <th scope="col" className="px-3 py-2 font-medium">Rôle</th>
                  <th scope="col" className="px-3 py-2 font-medium">Fournisseur</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2">Fonds de carte</td>
                  <td className="px-3 py-2">Affichage de la carte interactive</td>
                  <td className="px-3 py-2">IGN - Géoplateforme</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">Géocodage d'adresse</td>
                  <td className="px-3 py-2">Conversion de l'adresse d'une offre en coordonnées</td>
                  <td className="px-3 py-2">API Adresse (api-adresse.data.gouv.fr)</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">Autocomplétion d'adresse</td>
                  <td className="px-3 py-2">Suggestions pendant la saisie d'une adresse</td>
                  <td className="px-3 py-2">API Adresse (api-adresse.data.gouv.fr)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Le géocodage convertit l'adresse renseignée pour une offre, ou la commune saisie pour
            une recherche, en coordonnées géographiques. Une erreur ou une imprécision peut
            entraîner un positionnement incorrect ; la position affichée constitue une aide à la
            recherche et non une garantie de précision absolue.
          </p>
          <p>
            L'utilisation de ces services peut être soumise à leurs propres conditions et
            politiques de confidentialité.
          </p>
          <ToValidate>
            liste définitive des fournisseurs, qualification des éventuels sous-traitants au sens
            du RGPD et conditions applicables.
          </ToValidate>
        </Article>

        <Article number="22" title="Propriété intellectuelle">
          <p>
            Les éléments composant GéoEmploi sont susceptibles d'être protégés par les règles
            relatives à la propriété intellectuelle : logiciel, interface, éléments graphiques,
            textes, identité visuelle, structure des contenus et bases de données.
          </p>
          <p>
            Sauf autorisation, l'Utilisateur ne peut reproduire, modifier, distribuer ou exploiter
            commercialement les éléments protégés. Il reste responsable des droits attachés aux
            contenus qu'il publie et garantit disposer des droits nécessaires.
          </p>
          <p>
            Les données cartographiques et de géocodage restent soumises aux licences de leurs
            fournisseurs respectifs.
          </p>
          <ToValidate>titulaires des droits et licences applicables.</ToValidate>
        </Article>

        <Article number="23" title="Modification des CGU">
          <p>
            GéoEmploi peut modifier les présentes CGU afin de tenir compte de l'évolution du
            Service, de l'ajout ou de la suppression de fonctionnalités, ou d'évolutions
            techniques ou réglementaires. En cas de modification substantielle, les Utilisateurs
            sont informés selon les modalités appropriées.
          </p>
        </Article>

        <Article number="24" title="Limitation de responsabilité">
          <p>
            GéoEmploi met en œuvre les moyens nécessaires au fonctionnement du Service, sans
            garantir qu'il sera exempt d'erreurs, disponible en permanence ou adapté à tous les
            besoins particuliers.
          </p>
          <p>
            Conformément au cahier des charges, le prestataire technique n'est pas responsable du
            contenu des annonces. GéoEmploi ne saurait être tenu responsable du contenu publié
            par les Utilisateurs, de l'exactitude des informations fournies, du comportement d'un
            Candidat ou d'un Employeur, de l'issue d'une candidature, de la conclusion ou de
            l'exécution d'un contrat de travail, d'une erreur de localisation, d'une
            indisponibilité extérieure au Service ou des conséquences d'une utilisation non
            conforme aux CGU, sous réserve des dispositions légales impératives.
          </p>
        </Article>

        <Article number="25" title="Contact">
          <p>
            Pour toute question concernant l'utilisation de GéoEmploi, l'Utilisateur peut
            contacter l'équipe responsable du Service.
          </p>
          <p>
            Ministère du Job et Bonheur - Direction Numérique et Innovation
            <br />
            Adresse e-mail : contact@geoemploi.fr
            <br />
            Adresse postale : [à compléter]
          </p>
        </Article>

        <Article number="26" title="Droit applicable et règlement des litiges">
          <p>
            Les présentes CGU sont soumises au droit applicable en France, sous réserve des
            dispositions impératives éventuellement applicables.
          </p>
          <p>
            En cas de difficulté, l'Utilisateur est invité à contacter en priorité l'équipe
            responsable de GéoEmploi afin de rechercher une solution amiable.
          </p>
          <ToValidate>
            droit applicable définitif, juridiction compétente, modalités éventuelles de
            médiation et coordonnées du responsable juridique.
          </ToValidate>
        </Article>

        <Article number="27" title="Entrée en vigueur">
          <p>Les présentes CGU entrent en vigueur à compter de leur publication sur GéoEmploi.</p>
          <p>Version : V2.0 - Date de mise en vigueur : [à compléter]</p>
        </Article>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-primary">
            Annexe A - Durées de conservation
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Catégorie</th>
                  <th scope="col" className="px-3 py-2 font-medium">Durée cible</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Compte et profil', "Durée d'utilisation du compte, puis suppression à la demande de l'Utilisateur"],
                  ['Offre', 'Publication, archivage automatique à 30 jours, puis 2 ans au maximum après archivage'],
                  ['Candidature', 'Traitement, puis 2 ans au maximum après clôture'],
                  ['Documents de candidature (CV, lettre)', 'Même durée que la candidature'],
                  ["Localisation d'une offre", "Même durée que l'offre"],
                  ["Position GPS de l'Utilisateur", 'Aucune conservation'],
                  ["Compteur de vues d'une offre", "Même durée que l'offre, sans donnée sur le visiteur"],
                  ['Signalement', 'À définir selon la suite donnée'],
                  ['Avertissement', 'À définir'],
                  ['Journaux techniques', 'À définir selon leur finalité'],
                ].map(([category, duration]) => (
                  <tr key={category} className="border-t">
                    <td className="px-3 py-2">{category}</td>
                    <td className="px-3 py-2 text-muted-foreground">{duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Ces durées correspondent aux durées cibles définies dans le cadre du projet et
            restent soumises à validation juridique. La suppression du compte par l'Utilisateur
            produit un effet immédiat, indépendamment de ces durées.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-primary">
            Annexe B - Éléments soumis à validation juridique
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Sujet</th>
                  <th scope="col" className="px-3 py-2 font-medium">État</th>
                </tr>
              </thead>
              <tbody>
                {[
                  'Responsable du traitement',
                  'Bases légales des traitements',
                  'Géolocalisation et consentement',
                  'Durées de conservation et purge',
                  "Procédure d'exercice des droits",
                  'Coordonnées du responsable RGPD',
                  'Destinataires et sous-traitants',
                  'Conservation des journaux techniques',
                  'Vérification d\'activité des employeurs',
                  'Modération des offres et traitement des signalements',
                  'Échelle des sanctions et voies de recours',
                  'Conservation des signalements et avertissements',
                  'Propriété intellectuelle',
                  'Services tiers (IGN Géoplateforme, API Adresse)',
                  'Disponibilité du Service',
                  'Droit applicable et juridiction',
                ].map((subject) => (
                  <tr key={subject} className="border-t">
                    <td className="px-3 py-2">{subject}</td>
                    <td className="px-3 py-2 text-amber-800">
                      {subject === 'Coordonnées du responsable RGPD' ? 'À compléter' : 'À valider'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">
            Annexe C - Évolutions par rapport à la version V1.0
          </h2>
          <p className="text-sm">
            La version V1.0 avait été rédigée pour ChômageGo, sous le cahier des charges
            précédent. Les changements suivants ont été apportés :
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-sm">
            <li>Nom du service : ChômageGo devient GéoEmploi, sans bloc-marque de l'État.</li>
            <li>
              Consultation sans compte : le nouveau cahier des charges impose explicitement que
              la géolocalisation des offres fonctionne sans compte utilisateur ; l'article 4 le
              précise.
            </li>
            <li>
              Archivage automatique à 30 jours : nouvelle exigence du cahier des charges,
              implémentée et décrite à l'article 10.
            </li>
            <li>
              Documents de candidature : le dépôt d'un CV et d'une lettre de motivation est
              désormais implémenté ; l'article 11 en précise les formats, la taille et le
              traitement.
            </li>
            <li>
              Signalement des offres : nouvel article 12, correspondant à l'exigence du cahier
              des charges d'un système de signalement des offres frauduleuses ou non conformes.
            </li>
            <li>Avertissements et modération : l'article 18 intègre l'avertissement dans l'échelle des mesures.</li>
            <li>
              Suppression du compte : désormais implémentée dans l'application ; l'article 17 la
              décrit comme un droit exerçable directement, et non plus comme une simple
              possibilité de demande.
            </li>
            <li>
              Compteur de vues : introduit par l'exigence de tableau de bord employeur ;
              l'article 16 précise qu'il n'enregistre rien sur le visiteur.
            </li>
            <li>
              Services tiers : l'article 21 nomme les fournisseurs réellement utilisés, à savoir
              l'IGN Géoplateforme pour les fonds de carte et l'API Adresse pour le géocodage.
            </li>
            <li>
              Notification de candidature : exigence du cahier des charges non encore
              implémentée, signalée comme telle à l'article 11 plutôt que présentée comme
              opérationnelle.
            </li>
            <li>
              Modèle économique : la note relative à un abonnement employeur de 400 € par mois
              est supprimée. Le nouveau cahier des charges ne mentionne aucun modèle payant.
            </li>
            <li>Mention de démonstrateur : ajoutée en tête du document, conformément au gel du 7 septembre 2026.</li>
          </ul>
        </section>

        <div className="rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <p>Document préparé par : Amayyas AOUADENE - Chef de projet</p>
          <p>Destinataire : Florine Pontaillac - Conseillère juridique</p>
          <p>Version : 2.0 - Projet</p>
          <p className="font-medium text-foreground">Statut : En attente de validation juridique</p>
        </div>
      </div>
    </PageShell>
  )
}
