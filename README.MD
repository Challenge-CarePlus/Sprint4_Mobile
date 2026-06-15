# ECOA Mobile

## 1. Integrantes

* Andre Neves RM - 553515
* Caio Tominaga RM - 553633
* Eduardo Brites RM - 552943
* Isabela Barcellos RM - 553746
* Thais Gonçalves RM - 553892

## 2. Primeiros passos [GitHub]

Primeiramente, no terminal, clone o repositório com:

```bash
git clone https://github.com/Challenge-CarePlus/Sprint4_Mobile.git
```

Abra o projeto:

```bash
cd Sprint4_Mobile
```

Instale as dependências do backend:

```bash
cd ECOA_backend
npm install
```

Volte para a raiz do projeto:

```bash
cd ..
```

Instale as dependências do frontend:

```bash
cd ECOA_mobile
npm install
```

---

## 2.1. Primeiros passos [.zip]

Extraia o arquivo `.zip` e, no terminal, abra o projeto na pasta raiz:

```bash
cd [seu_diretorio]/Sprint4_Mobile
```

Instale as dependências do backend:

```bash
cd ECOA_backend
npm install
```

Volte para a raiz do projeto:

```bash
cd ..
```

Instale as dependências do frontend:

```bash
cd ECOA_mobile
npm install
```

---

## 3. Configuração do arquivo .env

O frontend utiliza variáveis de ambiente para definir o IP e a porta da API.

Dentro da pasta `ECOA_mobile`, crie um arquivo chamado `.env` com a seguinte estrutura:

```env
EXPO_PUBLIC_API_IP=SEU_IP_AQUI
EXPO_PUBLIC_API_PORT=3000
```

Exemplo para emulador Android:

```env
EXPO_PUBLIC_API_IP=10.0.2.2
EXPO_PUBLIC_API_PORT=3000
```

Exemplo para celular físico na mesma rede:

```env
EXPO_PUBLIC_API_IP=192.168.0.100
EXPO_PUBLIC_API_PORT=3000
```

> Atenção: coloque apenas o IP, sem `http://` e sem `:3000`, pois o projeto já monta automaticamente a URL da API e do WebSocket.

Para descobrir o IP da máquina, abra o terminal e execute:

```bash
ipconfig
```

Depois, procure pelo primeiro endereço `IPv4`, que geralmente aparece no formato:

```txt
192.168.x.x
```

---

## 4. Como rodar o projeto

Para rodar o backend, abra um terminal na pasta raiz do projeto e execute:

```bash
cd ECOA_backend
npm run dev
```

Em outro terminal, também na pasta raiz do projeto, execute o frontend:

```bash
cd ECOA_mobile
npx expo prebuild
npx expo run:android
```

Caso tenha alterado o arquivo `.env`, recomenda-se iniciar o Expo limpando o cache:

```bash
npm expo start -c
```

---

## 5. Importante saber

O projeto possui integração entre frontend e backend usando API HTTP e WebSocket.

A API é usada para login, cadastro e autenticação.

O WebSocket é usado na tela de exercício para enviar imagens da câmera ao backend e receber feedback em tempo real.

O arquivo responsável pela configuração da API fica em:

```txt
ECOA_mobile/config/apiConfig.ts
```

Ele usa as variáveis do `.env`:

```env
EXPO_PUBLIC_API_IP
EXPO_PUBLIC_API_PORT
```

A partir delas, o projeto monta automaticamente:

```txt
http://[ip]:[porta]
ws://[ip]:[porta]/exercise
```

---

## 6. Credenciais para login

Para logar dentro do aplicativo, utilize as seguintes credenciais:

```txt
email: ecoafono@email.com
senha: ecoa2026
```

Caso o login retorne “Usuário não encontrado”, cadastre esse usuário pela tela de cadastro ou verifique se ele existe no arquivo:

```txt
ECOA_backend/src/db/users.json
```

---

## 7. O que foi adicionado desde a última sprint

Na última sprint, o projeto possuía apenas:

* Login mockado;
* Página inicial;
* Menu;
* Persistência básica com AsyncStorage.

Nesta sprint, foram adicionadas as seguintes funcionalidades:

### Backend

* Criação de autenticação real com API;
* Rota de login;
* Rota de cadastro;
* Criptografia de senha com bcrypt;
* Geração de token JWT;
* Middleware de autenticação;
* Banco local em arquivo JSON;
* Rota `/health` para verificar se o backend está ativo;
* Servidor WebSocket na rota `/exercise`;
* Integração com TensorFlow;
* Integração com modelo de detecção de pontos faciais;
* Processamento de frames enviados pelo aplicativo;
* Cálculo de abertura da boca com base nos landmarks faciais;
* Retorno de feedback em tempo real para o frontend.

### Frontend

* Tela de cadastro de usuário;
* Login integrado com backend;
* Armazenamento do token com AsyncStorage;
* Interceptor do Axios para envio automático do token;
* Rotas públicas e privadas;
* Tela de introdução antes do exercício;
* Tela de câmera;
* Captura de imagens usando `react-native-vision-camera`;
* Envio de frames da câmera para o backend;
* Comunicação em tempo real via WebSocket;
* Exibição de feedback do exercício na tela;
* Renderização dos pontos faciais sobre a câmera;
* Feedback visual com cores diferentes;
* Tela de configurações;
* Configuração para mostrar ou ocultar landmarks;
* Configuração para ativar ou desativar feedback visual;
* Configuração de intervalo de captura;
* Configuração de câmera preferida, frontal ou traseira;
* Reset das configurações para o padrão;
* Persistência das preferências usando AsyncStorage;
* Uso de `.env` para configurar IP e porta da API;
* Ajustes na página inicial com cards de navegação;
* Adição de cards para Exercícios, Treinos, Evolução e Configurações.

---

## 8. Warnings e observações importantes

### O app não deve ser executado pelo Expo Go

Este projeto utiliza a biblioteca:

```txt
react-native-vision-camera
```

Essa biblioteca depende de código nativo da câmera. Por isso, o aplicativo não deve ser executado diretamente pelo Expo Go.

Para testar corretamente a câmera, utilize um build nativo/development build.

No Android, rode:

```bash
npm run android
```

ou:

```bash
npx expo run:android
```

### A versão web não suporta a tela de câmera

Mesmo que o Expo permita abrir o projeto no navegador com a tecla `w`, a tela de câmera com `react-native-vision-camera` foi feita para ambiente mobile nativo.

Por isso, a versão web pode funcionar para telas simples, como login e configurações, mas a tela de exercício com câmera pode não funcionar corretamente no navegador.

### O backend precisa estar rodando antes do exercício

Antes de iniciar a tela de exercício, certifique-se de que o backend está ativo com:

```bash
cd ECOA_backend
npm run dev
```

Se o backend não estiver rodando, o aplicativo pode exibir erro de conexão com o servidor.

### Celular e computador precisam estar na mesma rede

Caso o aplicativo esteja rodando em um celular físico, o celular e o computador precisam estar conectados na mesma rede Wi-Fi.

Além disso, o `.env` deve usar o IP local do computador.

### Não use localhost no celular físico

Se estiver rodando no celular físico, não use:

```env
EXPO_PUBLIC_API_IP=localhost
```

Use o IPv4 da máquina, por exemplo:

```env
EXPO_PUBLIC_API_IP=192.168.0.100
```

### Use 10.0.2.2 no emulador Android

Se estiver usando emulador Android, normalmente o IP correto é:

```env
EXPO_PUBLIC_API_IP=10.0.2.2
```

### Reinicie o Expo após mudar o .env

Sempre que alterar o `.env`, pare o Expo e rode novamente:

```bash
npm expo start -c
```

---

## 9. Tecnologias utilizadas

### Frontend

* React Native;
* Expo;
* TypeScript;
* React Navigation;
* Axios;
* AsyncStorage;
* React Native Vision Camera;
* Expo File System.

### Backend

* Node.js;
* Express;
* TypeScript;
* WebSocket;
* JWT;
* bcrypt;
* TensorFlow.js;
* Face Landmarks Detection;
* JSON local como base de dados.
