# Publicar o Ateliê Cultural (fora do Lovable)

O app precisa de dois serviços gratuitos: **Supabase** (banco e login) e **Cloudflare Pages** (o site em si).
O endereço final, `atelie.caco.online`, é configurado no DNS da Hostinger.

## 1. Supabase (uma vez só)
1. SQL Editor > New query > colar o arquivo `atelie-schema.sql` > Run.
2. Authentication > URL Configuration:
   - Site URL: `https://atelie.caco.online`
   - Redirect URLs: `https://atelie.caco.online/**` (e, para testes, `https://*.pages.dev/**`)
3. As chaves públicas já estão no arquivo `.env`. Nunca coloque a `service_role` nem a senha do banco no repositório.

## 2. Cloudflare Pages
1. Workers & Pages > Create > Pages > Connect to Git > escolher este repositório e a branch `main`.
2. Build command: `bun run build`  |  Build output directory: `dist`
3. Settings > Variables and Secrets (Production): `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (os mesmos valores do `.env`).
4. Settings > Runtime > Compatibility flags: adicionar `nodejs_compat`.
5. Fazer um novo deploy e abrir o endereço `*.pages.dev` pra testar o cadastro e o login.

## 3. Endereço atelie.caco.online
1. No projeto do Pages: Custom domains > Set up a domain > `atelie.caco.online`.
2. Só depois, na Hostinger (DNS do caco.online): criar um registro `CNAME` com nome `atelie` e destino `NOME-DO-PROJETO.pages.dev`.
   Criar o CNAME antes de adicionar o domínio no Pages causa erro 522.

## IA
O app não chama nenhuma IA sozinho. A verificação, a ajuda e a leitura de fontes geram um texto que a pessoa cola no Claude, ChatGPT ou Gemini dela.
