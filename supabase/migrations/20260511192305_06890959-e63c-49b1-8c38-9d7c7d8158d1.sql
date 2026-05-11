UPDATE public.menu_items
SET ingredientes_imagem_url = 'https://felpzbvxnzffqsxrbuml.supabase.co/storage/v1/object/public/cardapio-imagens/ingredientes/ingredientes-22ea197c-9ead-4c06-8461-78db9aba94e2.png?v=' || extract(epoch from now())::bigint
WHERE id = '22ea197c-9ead-4c06-8461-78db9aba94e2';