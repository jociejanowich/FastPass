import { makeStyles, tokens } from '@fluentui/react-components';
import { FlashRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  mark: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    flexShrink: 0,
  },
});

export function ProductMark(): JSX.Element {
  const styles = useStyles();
  return (
    <span className={styles.mark} aria-hidden="true">
      <FlashRegular fontSize={18} />
    </span>
  );
}
