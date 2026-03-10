# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

## 🏃‍♂️ 주요 실행 스크립트 가이드

`package.json`의 주요 스크립트 명령어들은 다음과 같은 용도로 사용됩니다. (주로 `pnpm`을 통해 실행)

1. **커스텀 개발 앱(Dev Client) 실행 (현재 메인 워크플로우)**
   - `pnpm ios` 또는 `pnpm android`
   - 네이티브 패키지가 포함된 커스텀 앱(Dev Client)과 연결하여 실행합니다.
   - 평상시 개발할 때 계속 이 명령어를 입력하시면 됩니다.

2. **기본 Expo Go 연결 (가볍게 띄울 때)**
   - `pnpm ios:go` 또는 `pnpm android:go`
   - 네이티브 코드가 필요 없는 단순 구동 시, 앱스토어의 일반 `Expo Go`를 통해 빠르게 실행합니다.

3. **로컬 컴파일 및 네이티브 빌드 (직접 빌드 테스트 시)**
   - `pnpm run:ios` 또는 `pnpm run:android`
   - 네이티브 패키지 변경 후 **로컬 Mac 환경**(Xcode, Android Studio)을 이용해 아예 새로 앱을 컴파일하고 띄울 때 사용합니다. (시간이 오래 걸립니다)

4. **커스텀 클라이언트 앱 EAS 빌드 (새 네이티브 패키지 설치 시 권장)**
   - `pnpm build:dev:ios` 또는 `pnpm build:dev:android`
   - 새로운 네이티브 모듈(예: 새 폰트, SQLite, 결제 등)을 추가했다면, EAS 클라우드를 통해 개발용 커스텀 앱(Dev Client)을 새로 빌드해서 단말기/시뮬레이터에 다시 설치해주어야 합니다. 최초 1회, 또는 네이티브 관련 변경사항이 있을 때 실행합니다.
