# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   pnpm start:ios
   # or
   pnpm start:android
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

1. **로컬 개발 서버(Metro)만 실행 (현재 메인 워크플로우)**
   - `pnpm start:ios` 또는 `pnpm start:android`
   - 이미 기기에 설치된 커스텀 앱(Dev Client)을 깨워 연결합니다. 내장된 네이티브 코드가 변경되지 않았을 때 가장 빠르고 가볍게 코딩할 수 있습니다.

2. **외부 네트워크에서 원격 테스트 (Tunnel 모드)**
   - `pnpm start:tunnel:ios` 또는 `pnpm start:tunnel:android`
   - 내 폰이 LTE나 다른 식당 와이파이에 접속해 있을 때 사용합니다. 전 세계 어디서든 내 Mac의 서버(Metro)에 접속할 수 있도록 ngrok 터널을 뚫어줍니다.

3. **기본 Expo Go 연결 (가볍게 띄울 때)**
   - `pnpm start:go:ios` 또는 `pnpm start:go:android`
   - 네이티브 코드가 필요 없는 단순 구동 시, 앱스토어의 일반 `Expo Go`를 통해 빠르게 실행합니다.

3. **로컬 개발용 네이티브 앱 빌드 및 실행**
   - `pnpm build-run:ios` 또는 `pnpm build-run:android`
   - 네이티브 패키지 변경 후 **로컬 Mac 환경**(Xcode, Android Studio)을 이용해 아예 새로 앱을 컴파일한 뒤 바로 실행할 때 사용합니다. (시간이 오래 걸립니다)

4. **커스텀 클라이언트 앱 EAS 빌드 (새 네이티브 패키지 설치 시 권장)**
   - `pnpm build:cloud:ios` 또는 `pnpm build:cloud:android`
   - 새로운 네이티브 모듈(예: 새 폰트, SQLite, 결제 등)을 추가했다면, EAS 클라우드를 통해 개발용 커스텀 앱(Dev Client)을 새로 빌드해서 단말기/시뮬레이터에 다시 설치해주어야 합니다. 최초 1회, 또는 네이티브 관련 변경사항이 있을 때 실행합니다.

---

## 📱 무료 계정으로 내 아이폰에 커스텀 앱(Dev Client) 설치하기

애플 유료 개발자 계정($99/년)을 결제하기 전에는 클라우드(EAS) 빌드 파일을 아이폰에 바로 다운받아 설치할 수 없습니다. 대신 Mac과 iPhone을 **유선 연결**하여 직접 앱을 넣을 수 있습니다.

**[설치 방법]**
1. 아이폰을 Mac에 유선(USB 케이블)으로 연결합니다.
2. 터미널에서 `pnpm build:local:ios` 명령어를 실행하여 로컬 빌드 및 `ios` 폴더를 생성합니다. (오류가 나도 폴더만 생기면 됩니다)
3. Mac에서 **Xcode** 프로그램을 실행합니다.
4. 방금 전 생성된 프로젝트 내부의 `ios/mobile.xcworkspace` 파일을 엽니다.
5. Xcode 좌측의 최상단 프로젝트 이름(`mobile`)을 클릭하고, **[Signing & Capabilities]** 탭으로 이동합니다.
6. **Team** 드롭다운 메뉴에서 본인의 무료 Apple ID 계정(Personal Team)을 선택하여 로그인/지정합니다.
7. 아이폰의 [설정] > [일반] > [VPN 및 기기 관리] 메뉴에서 내 개발자 계정("개발자 앱 신뢰")을 탭하여 신뢰합니다.
8. Xcode 화면 최상단에서 시뮬레이터 대신 **"내 아이폰 이름"**을 타겟 디바이스로 선택하고 ▶️(Play) 버튼을 눌러 앱을 내 폰에 설치합니다!

> ⚠️ **주의사항**: 위 방법으로 설치된 앱 프로비저닝 프로파일은 **7일 뒤에 만료**됩니다. 앱이 갑자기 튕기기 시작하면 1주일이 지난 것이므로, 케이블을 다시 연결하고 Xcode에서 Play 버튼을 한 번 더 눌러주어 앱 인증을 갱신해야 합니다.
