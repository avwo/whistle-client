!macro customInstall
  DeleteRegKey HKCR "whistle"
  WriteRegStr HKCR "whistle" "" "URL:whistle"
  WriteRegStr HKCR "whistle" "URL Protocol" ""
  WriteRegStr HKCR "whistle\shell" "" ""
  WriteRegStr HKCR "whistle\shell\Open" "" ""
  WriteRegStr HKCR "whistle\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend

!macro customUnInstall
  DeleteRegKey HKCR "whistle"
!macroend