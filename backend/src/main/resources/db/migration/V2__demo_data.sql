-- Donnees de demonstration : 3 bots (toujours en ligne, jamais reclamables), 3 anciens membres hors ligne
-- (indicatifs liberes, donc reprenables) et 5 canaux avec un peu d'historique.
-- Intervalles a 2 chiffres max (HOUR puis MINUTE) : syntaxe commune PostgreSQL / H2.

INSERT INTO chat_users (id, nickname, nickname_key, color, bot, created_at, last_seen_at) VALUES
    ('b0700000-0000-4000-8000-0000000000a1', 'ada',    'ada',    'LILAS',  TRUE,  CURRENT_TIMESTAMP - INTERVAL '31' HOUR, NULL),
    ('b0700000-0000-4000-8000-0000000000a2', 'grace',  'grace',  'CORAIL', TRUE,  CURRENT_TIMESTAMP - INTERVAL '31' HOUR, NULL),
    ('b0700000-0000-4000-8000-0000000000a3', 'linus',  'linus',  'MENTHE', TRUE,  CURRENT_TIMESTAMP - INTERVAL '31' HOUR, NULL),
    ('0a000000-0000-4000-8000-000000000001', 'margot', 'margot', 'AZUR',   FALSE, CURRENT_TIMESTAMP - INTERVAL '31' HOUR, CURRENT_TIMESTAMP - INTERVAL '7' HOUR),
    ('0a000000-0000-4000-8000-000000000002', 'yanis',  'yanis',  'CITRON', FALSE, CURRENT_TIMESTAMP - INTERVAL '31' HOUR, CURRENT_TIMESTAMP - INTERVAL '4' HOUR),
    ('0a000000-0000-4000-8000-000000000003', 'sacha',  'sacha',  'AMBRE',  FALSE, CURRENT_TIMESTAMP - INTERVAL '31' HOUR, CURRENT_TIMESTAMP - INTERVAL '1' HOUR);

INSERT INTO rooms (id, name, topic, created_by, created_at) VALUES
    ('c0000000-0000-4000-8000-000000000001', 'general',     'Le canal commun : présentations, annonces et discussions à bâtons rompus.', NULL, CURRENT_TIMESTAMP - INTERVAL '31' HOUR),
    ('c0000000-0000-4000-8000-000000000002', 'angular',     'Signals, standalone, zoneless… le côté navigateur.',                        NULL, CURRENT_TIMESTAMP - INTERVAL '31' HOUR),
    ('c0000000-0000-4000-8000-000000000003', 'spring-boot', 'Spring Boot, JPA, STOMP : le côté serveur.',                                NULL, CURRENT_TIMESTAMP - INTERVAL '31' HOUR),
    ('c0000000-0000-4000-8000-000000000004', 'entraide',    'Un bug, une question, une revue de code ? On s''entraide.',                 NULL, CURRENT_TIMESTAMP - INTERVAL '31' HOUR),
    ('c0000000-0000-4000-8000-000000000005', 'hors-sujet',  'Café, jeux, musique : tout ce qui n''est pas du code.',                    NULL, CURRENT_TIMESTAMP - INTERVAL '31' HOUR);

-- Les bots sont partout ; les anciens membres dans quelques canaux.
INSERT INTO memberships (room_id, user_id, last_read_message_id, joined_at)
SELECT r.id, u.id, NULL, CURRENT_TIMESTAMP - INTERVAL '31' HOUR
FROM rooms r, chat_users u
WHERE u.bot = TRUE
   OR (u.nickname = 'margot' AND r.name IN ('general', 'angular', 'entraide'))
   OR (u.nickname = 'yanis'  AND r.name IN ('general', 'spring-boot', 'hors-sujet'))
   OR (u.nickname = 'sacha'  AND r.name IN ('general', 'angular', 'hors-sujet'));

-- Ordre chronologique : l'identifiant sequentiel sert d'ordre d'affichage et de curseur.
INSERT INTO messages (room_id, author_id, content, sent_at) VALUES
    ('c0000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-000000000001', 'Bonjour tout le monde ! Première fois sur Relais 👋', CURRENT_TIMESTAMP - INTERVAL '30' HOUR),
    ('c0000000-0000-4000-8000-000000000001', 'b0700000-0000-4000-8000-0000000000a1', 'Bienvenue @margot ! Les canaux sont à gauche, les personnes à l''écoute à droite.', CURRENT_TIMESTAMP - INTERVAL '29' HOUR - INTERVAL '58' MINUTE),
    ('c0000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-000000000002', 'Quelqu''un sait si #spring-boot parle aussi de WebSocket ?', CURRENT_TIMESTAMP - INTERVAL '29' HOUR),
    ('c0000000-0000-4000-8000-000000000001', 'b0700000-0000-4000-8000-0000000000a2', '@yanis oui, c''est même le sujet du moment là-bas.', CURRENT_TIMESTAMP - INTERVAL '28' HOUR - INTERVAL '57' MINUTE),
    ('c0000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-000000000003', 'Vous êtes passés en zoneless sur vos projets ?', CURRENT_TIMESTAMP - INTERVAL '26' HOUR),
    ('c0000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-000000000001', 'Oui, avec des signals partout. La détection de changements est enfin prévisible.', CURRENT_TIMESTAMP - INTERVAL '25' HOUR - INTERVAL '56' MINUTE),
    ('c0000000-0000-4000-8000-000000000002', 'b0700000-0000-4000-8000-0000000000a1', 'Et httpResource pour les lectures : plus besoin de gérer les abonnements à la main.', CURRENT_TIMESTAMP - INTERVAL '25' HOUR - INTERVAL '50' MINUTE),
    ('c0000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-000000000003', 'linkedSignal m''a sauvé pour un formulaire qui dépend d''une sélection.', CURRENT_TIMESTAMP - INTERVAL '25' HOUR),
    ('c0000000-0000-4000-8000-000000000003', '0a000000-0000-4000-8000-000000000002', 'Petit retour : STOMP avec le broker simple suffit largement pour une démo, pas besoin de RabbitMQ.', CURRENT_TIMESTAMP - INTERVAL '20' HOUR),
    ('c0000000-0000-4000-8000-000000000003', 'b0700000-0000-4000-8000-0000000000a3', 'Tant que ça tient la charge. Mesure avant d''optimiser.', CURRENT_TIMESTAMP - INTERVAL '19' HOUR - INTERVAL '55' MINUTE),
    ('c0000000-0000-4000-8000-000000000003', 'b0700000-0000-4000-8000-0000000000a2', 'Pensez aux battements de cœur, sinon un onglet fermé brutalement reste « en ligne ».', CURRENT_TIMESTAMP - INTERVAL '19' HOUR),
    ('c0000000-0000-4000-8000-000000000004', '0a000000-0000-4000-8000-000000000001', 'Mon glisser-déposer CDK saute quand la liste défile, une idée ?', CURRENT_TIMESTAMP - INTERVAL '8' HOUR),
    ('c0000000-0000-4000-8000-000000000004', 'b0700000-0000-4000-8000-0000000000a2', '@margot regarde cdkDropListAutoScrollStep, et vérifie que le conteneur qui défile est bien le parent.', CURRENT_TIMESTAMP - INTERVAL '7' HOUR - INTERVAL '55' MINUTE),
    ('c0000000-0000-4000-8000-000000000004', '0a000000-0000-4000-8000-000000000001', 'C''était ça, merci !', CURRENT_TIMESTAMP - INTERVAL '7' HOUR - INTERVAL '40' MINUTE),
    ('c0000000-0000-4000-8000-000000000005', '0a000000-0000-4000-8000-000000000003', 'Pause café ☕ Vous écoutez quoi en codant ?', CURRENT_TIMESTAMP - INTERVAL '5' HOUR),
    ('c0000000-0000-4000-8000-000000000005', '0a000000-0000-4000-8000-000000000002', 'Lo-fi, toujours. Ou rien du tout quand je débogue.', CURRENT_TIMESTAMP - INTERVAL '4' HOUR - INTERVAL '50' MINUTE),
    ('c0000000-0000-4000-8000-000000000005', 'b0700000-0000-4000-8000-0000000000a3', 'Le bruit du ventilateur.', CURRENT_TIMESTAMP - INTERVAL '4' HOUR - INTERVAL '45' MINUTE),
    ('c0000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-000000000003', 'Quelqu''un a déjà mentionné un bot ? Ils répondent vraiment 😄', CURRENT_TIMESTAMP - INTERVAL '2' HOUR),
    ('c0000000-0000-4000-8000-000000000001', 'b0700000-0000-4000-8000-0000000000a1', 'Essayez donc : écrivez @ada dans un message.', CURRENT_TIMESTAMP - INTERVAL '1' HOUR - INTERVAL '50' MINUTE);
