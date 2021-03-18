# Private Mail Archiver
**자신이 결제한** 아이즈원 프라이빗 메일을 PC에서도 볼 수 있게 해주는 도구입니다.

기존 툴들 대비 가지는 장점은 다음과 같습니다.
- 다른 설치파일 (Python, Nox 등) 없음
- Root CA 설치 등 휴대폰에서의 추가 과정 없음

현재는 안드로이드만 지원하며 (iOS 옵션을 추가해야 해요), Import -> Download -> Export 순서대로 사용하면 됩니다.

## ⚠️ Disclaimer
본 도구는 개인 사용 용도로 제작된 프로그램입니다.
본 프로그램의 이용에 따른 책임은 사용자에게 있으며, 개발자는 프로그램을 사용함에 따라 발생할 수 있는 결과에 일체 책임을 지지 않습니다.

## Getting Started (개발자용)
Dependencies: Node ^15.3.0
```bash
git clone https://github.com/jungnoh/private-mail
cd private-mail
npm install
npm run package  # Build packages
npm run start    # Run in development mode
```