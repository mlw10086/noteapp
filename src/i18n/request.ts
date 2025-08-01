import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // 从 cookies 中获取语言设置，默认为中文
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'zh';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
