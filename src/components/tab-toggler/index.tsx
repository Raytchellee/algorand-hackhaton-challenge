import classNames from 'classnames';
import styles from './index.module.scss';
import { useEffect, useState } from 'react';

interface TabTogglerProps {
  tabs: string[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
  randomId?: string;
  theme?: 'dark' | 'light';
}

export const TabToggler = ({
  tabs,
  selectedTab,
  onSelectTab,
  randomId = 'bla-bla-bla',
  theme = 'dark',
}: TabTogglerProps) => {
  const [sliderPosition, setSliderPosition] = useState({
    width: 0,
    left: 0,
  });

  const onTabChange = (tab: string, index: number) => {
    const tabId = randomId + index + tab;
    const tabElement = document.getElementById(tabId);

    if (tabElement) {
      setSliderPosition({
        width: tabElement.offsetWidth,
        left: tabElement.offsetLeft,
      });
    }

    onSelectTab(tab);
  };

  useEffect(() => {
    const selectedTabIndex = tabs.findIndex((tab) => tab === selectedTab);
    onTabChange(selectedTab, selectedTabIndex);
  }, []);

  return (
    <div className={classNames(styles.wrapper, theme === 'light' ? styles.light : '')}>
      <div
        className={styles.slider}
        style={{
          width: sliderPosition.width,
          left: sliderPosition.left,
        }}
      ></div>
      <div className={styles.tabs}>
        {tabs.map((tab, index) => (
          <div
            className={classNames(styles.tab, tab === selectedTab ? styles.active : '')}
            key={index}
            id={randomId + index + tab}
            onClick={() => onTabChange(tab, index)}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
};
