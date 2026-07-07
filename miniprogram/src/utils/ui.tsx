import { View, Text, Navigator } from '@tarojs/components'

// ========== 顶部品牌头 ==========
interface HeaderProps {
  variant?: 'home' | 'inner' | 'dark'
  active?: 'home' | 'articles' | 'cao' | 'about'
}

export function SiteHeader({ variant = 'inner', active }: HeaderProps) {
  return (
    <View className={`dv-header dv-header--${variant}`}>
      <View className='dv-header__brand'>
        <Navigator url='/pages/index/index' hoverClass='none' className='dv-header__brand-name'>
          <Text>Dawn Vision</Text>
        </Navigator>
        <Text className='dv-header__brand-sub'>Daily Briefing</Text>
      </View>
      <View className='dv-header__nav'>
        <Navigator url='/pages/index/index' hoverClass='none' className={`dv-header__link ${active === 'home' ? 'dv-header__link--active' : ''}`}>
          <Text>Home</Text>
        </Navigator>
        <Navigator url='/pages/articles/index' hoverClass='none' className={`dv-header__link ${active === 'articles' ? 'dv-header__link--active' : ''}`}>
          <Text>Articles</Text>
        </Navigator>
        <Navigator url='/pages/cao/index' hoverClass='none' className={`dv-header__link ${active === 'cao' ? 'dv-header__link--active' : ''}`}>
          <Text>Cao</Text>
        </Navigator>
        <Navigator url='/pages/about/index' hoverClass='none' className={`dv-header__link ${active === 'about' ? 'dv-header__link--active' : ''}`}>
          <Text>About</Text>
        </Navigator>
      </View>
    </View>
  )
}

// ========== 底部导航 ==========
interface NavProps {
  active?: 'home' | 'articles' | 'cao' | 'about'
  onHome?: boolean
}

export function BottomNav({ active, onHome }: NavProps) {
  return (
    <View className={`dv-bottomnav ${onHome ? 'dv-bottomnav--home' : ''}`}>
      <Navigator url='/pages/index/index' hoverClass='none' openType='redirect' className={`dv-bottomnav__item ${active === 'home' ? 'dv-bottomnav__item--active' : ''}`}>
        <Text className='dv-bottomnav__icon'>—</Text>
        <Text className='dv-bottomnav__label'>Home</Text>
      </Navigator>
      <Navigator url='/pages/articles/index' hoverClass='none' openType='redirect' className={`dv-bottomnav__item ${active === 'articles' ? 'dv-bottomnav__item--active' : ''}`}>
        <Text className='dv-bottomnav__icon'>≡</Text>
        <Text className='dv-bottomnav__label'>Articles</Text>
      </Navigator>
      <Navigator url='/pages/cao/index' hoverClass='none' openType='redirect' className={`dv-bottomnav__item ${active === 'cao' ? 'dv-bottomnav__item--active' : ''}`}>
        <Text className='dv-bottomnav__icon'>!</Text>
        <Text className='dv-bottomnav__label'>Cao</Text>
      </Navigator>
      <Navigator url='/pages/about/index' hoverClass='none' openType='redirect' className={`dv-bottomnav__item ${active === 'about' ? 'dv-bottomnav__item--active' : ''}`}>
        <Text className='dv-bottomnav__icon'>i</Text>
        <Text className='dv-bottomnav__label'>About</Text>
      </Navigator>
    </View>
  )
}

// ========== Footer ==========
interface FooterProps {
  variant?: 'home' | 'inner'
}

export function SiteFooter({ variant = 'inner' }: FooterProps) {
  return (
    <View className={`dv-footer dv-footer--${variant}`}>
      <View className='dv-footer__col'>
        <Text className='dv-footer__label'>Subscribe</Text>
        <Text className='dv-footer__text'>WeChat Channels</Text>
      </View>
      <View className='dv-footer__col'>
        <Text className='dv-footer__label'>Follow</Text>
        <Text className='dv-footer__text'>@DawnVision</Text>
      </View>
      <View className='dv-footer__col'>
        <Text className='dv-footer__label'>Contact</Text>
        <Text className='dv-footer__text'>hello@dawnvision.net</Text>
      </View>
      <View className='dv-footer__copyright'>
        <Text>© 2026 DawnVision. All rights reserved.</Text>
      </View>
    </View>
  )
}
