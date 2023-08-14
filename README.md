# Knowledge Graph Editor (Chrome Extension)

This extension is designed for synchronizing findings/knowledges into a [biomedgps instance](https://github.com/yjcyxky/biomedgps). The findings/knowledges are annotated from literature and other sources using [Label Studio](https://github.com/yjcyxky/label-studio).

## Demo

![Fig1](./assets/1-kg-editor-button.png)

![Fig2](./assets/2-kg-editor.png)

![Fig3](./assets/3-kg-editor-editing.png)

![Fig4](./assets/4-kg-editor-popup.png)

![Fig5](./assets/5-kg-editor-popup-viewer.png)

## How to install and use?

1. Download the extension from [here](https://github.com/yjcyxky/knowledge-graph-editor/releases).

2. Enable developer mode in Chrome.
![Enable developer mode](./assets/manual/1-enable-developer-mode.png)

3. Click "Load unpacked" button and select the extension folder.
![Load unpacked](./assets/manual/2-click-load-unpacked-button.png)

![Load the extension](./assets/manual/3-load-the-extension.png)

4. Enable the extension.
![Show Extension](./assets/manual/4-show-extension.png)

5. Click the extension icon and login.
![Login](./assets/manual/5-login.png)

6. Input your account and password.
![Input Account and Password](./assets/manual/6-input-account-password.png)

7. Login success.
![Login Success](./assets/manual/7-success.png)

8. Open the `[Prophet Studio](https://prophet-studio.3steps.cn)` and click the `Annotate` button.
![Annotate](./assets/manual/8-annotate.png)

9. Edit the findings.
![Edit Findings](./assets/manual/9-edit-findings.png)

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.
