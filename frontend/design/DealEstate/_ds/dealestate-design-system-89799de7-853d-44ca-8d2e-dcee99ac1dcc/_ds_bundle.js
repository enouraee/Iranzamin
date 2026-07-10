/* @ds-bundle: {"format":3,"namespace":"DealEstateDesignSystem_89799d","components":[{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data/Badge.jsx"},{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"PropertyCard","sourcePath":"components/data/PropertyCard.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/data/Avatar.jsx":"224f075ccc88","components/data/Badge.jsx":"88099209368d","components/data/Card.jsx":"de1648ecfb31","components/data/PropertyCard.jsx":"9976c7b9b07d","components/data/StatCard.jsx":"071104cb5650","components/forms/Button.jsx":"faf71e736d04","components/forms/IconButton.jsx":"2b35129a1ec1","components/forms/Input.jsx":"3cca5111064a","components/forms/Select.jsx":"52864b391e0b","components/forms/Switch.jsx":"4a9a51713643","components/navigation/BottomNav.jsx":"40c65fe46ca0","components/navigation/Tabs.jsx":"a39c685097bd","ui_kits/app/AddPropertyScreen.jsx":"84817e450ae6","ui_kits/app/AppShell.jsx":"e52b1ae710eb","ui_kits/app/DashboardScreen.jsx":"36456bea1d67","ui_kits/app/LoginScreen.jsx":"94237ecf76cc","ui_kits/app/PropertiesScreen.jsx":"286e668508e1","ui_kits/app/PropertyDetailScreen.jsx":"a71a5c19a791","ui_kits/app/data.jsx":"b25766779d31","ui_kits/app/icons.jsx":"38f48eb16740"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DealEstateDesignSystem_89799d = window.DealEstateDesignSystem_89799d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 32,
  md: 40,
  lg: 56
};
function initials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  if (!parts[0]) return '؟';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).slice(0, 2);
}

/**
 * User/agent avatar — image when available, otherwise tinted initials.
 */
function Avatar({
  name = '',
  src,
  size = 'md',
  style,
  ...rest
}) {
  const dim = SIZES[size] || SIZES.md;
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 15;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: '50%',
      overflow: 'hidden',
      flex: 'none',
      background: 'var(--color-primary-soft)',
      color: 'var(--blue-700)',
      fontSize,
      fontWeight: 'var(--weight-semibold)',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    bg: 'var(--surface-sunken)',
    fg: 'var(--text-secondary)',
    dot: 'var(--gray-400)'
  },
  primary: {
    bg: 'var(--color-primary-soft)',
    fg: 'var(--blue-700)',
    dot: 'var(--color-primary)'
  },
  success: {
    bg: 'var(--color-success-soft)',
    fg: 'var(--color-success-text)',
    dot: 'var(--color-success)'
  },
  danger: {
    bg: 'var(--color-danger-soft)',
    fg: 'var(--color-danger-text)',
    dot: 'var(--color-danger)'
  },
  warning: {
    bg: 'var(--color-warning-soft)',
    fg: 'var(--gold-700)',
    dot: 'var(--color-warning)'
  },
  accent: {
    bg: 'var(--color-accent-soft)',
    fg: 'var(--gold-700)',
    dot: 'var(--color-accent)'
  }
};

/**
 * Small status/label pill. Use `dot` for a leading status indicator.
 */
function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  children,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  const dims = size === 'sm' ? {
    fontSize: 'var(--text-xs)',
    padding: '2px 8px',
    gap: 5
  } : {
    fontSize: 'var(--text-sm)',
    padding: '4px 10px',
    gap: 6
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: dims.gap,
      padding: dims.padding,
      fontSize: dims.fontSize,
      fontWeight: 'var(--weight-medium)',
      lineHeight: 1.4,
      color: t.fg,
      background: t.bg,
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: t.dot,
      flex: 'none'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Surface container. The default building block for grouped content.
 */
function Card({
  padding = 'md',
  interactive = false,
  children,
  style,
  onClick,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const pad = padding === 'none' ? 0 : padding === 'sm' ? 'var(--space-3)' : padding === 'lg' ? 'var(--space-6)' : 'var(--space-4)';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => interactive && setHovered(true),
    onMouseLeave: () => interactive && setHovered(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: pad,
      boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      transition: 'box-shadow 160ms ease, transform 120ms ease',
      transform: hovered ? 'translateY(-2px)' : 'none',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/PropertyCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Property listing row/card. The signature object of the DealEstate app.
 * `status` drives the availability pill: 'available' (خالی) | 'occupied' (پر).
 */
function PropertyCard({
  title,
  district,
  price,
  meta = [],
  status = 'available',
  image,
  code,
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const isAvail = status === 'available';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-3)',
      boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      transform: hovered ? 'translateY(-2px)' : 'none',
      transition: 'box-shadow 160ms ease, transform 120ms ease',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 92,
      height: 92,
      flex: 'none',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--surface-sunken)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 9v.01M9 12v.01M9 15v.01M9 18v.01"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-primary)',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: isAvail ? 'success' : 'danger',
    size: "sm",
    dot: true
  }, isAvail ? 'خالی' : 'پر')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })), /*#__PURE__*/React.createElement("span", null, district), code && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "\xB7 \u06A9\u062F ", code)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, meta.map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, m))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--color-primary)'
    }
  }, price))));
}
Object.assign(__ds_scope, { PropertyCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/PropertyCard.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TREND = {
  up: {
    color: 'var(--color-success-text)',
    sign: '▲'
  },
  down: {
    color: 'var(--color-danger-text)',
    sign: '▼'
  }
};

/**
 * Dashboard metric tile: big number, label, optional icon and trend.
 */
function StatCard({
  label,
  value,
  icon = null,
  trend,
  trendValue,
  accent = 'primary',
  style,
  ...rest
}) {
  const accentColor = accent === 'success' ? 'var(--color-success)' : accent === 'danger' ? 'var(--color-danger)' : accent === 'accent' ? 'var(--color-accent)' : 'var(--color-primary)';
  const accentSoft = accent === 'success' ? 'var(--color-success-soft)' : accent === 'danger' ? 'var(--color-danger-soft)' : accent === 'accent' ? 'var(--color-accent-soft)' : 'var(--color-primary-soft)';
  const t = trend ? TREND[trend] : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)'
    }
  }, label), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-md)',
      background: accentSoft,
      color: accentColor
    }
  }, icon)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-3xl)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-primary)',
      lineHeight: 1
    }
  }, value), t && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-medium)',
      color: t.color
    }
  }, t.sign, " ", trendValue)));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 36,
    padding: '0 14px',
    fontSize: 'var(--text-sm)',
    gap: 6,
    radius: 'var(--radius-sm)'
  },
  md: {
    height: 44,
    padding: '0 18px',
    fontSize: 'var(--text-md)',
    gap: 8,
    radius: 'var(--radius-md)'
  },
  lg: {
    height: 52,
    padding: '0 24px',
    fontSize: 'var(--text-lg)',
    gap: 10,
    radius: 'var(--radius-md)'
  }
};
function variantStyle(variant, hovered) {
  switch (variant) {
    case 'secondary':
      return {
        background: hovered ? 'var(--surface-hover)' : 'var(--surface-card)',
        color: 'var(--color-primary)',
        border: '1px solid var(--border-strong)'
      };
    case 'ghost':
      return {
        background: hovered ? 'var(--color-primary-soft)' : 'transparent',
        color: 'var(--color-primary)',
        border: '1px solid transparent'
      };
    case 'danger':
      return {
        background: hovered ? 'var(--color-danger-hover)' : 'var(--color-danger)',
        color: '#fff',
        border: '1px solid transparent'
      };
    case 'primary':
    default:
      return {
        background: hovered ? 'var(--color-primary-hover)' : 'var(--color-primary)',
        color: 'var(--color-on-primary)',
        border: '1px solid transparent'
      };
  }
}

/**
 * Primary call-to-action button. RTL-aware (icon sits at the logical start).
 */
function Button({
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'start',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = variantStyle(variant, hovered && !disabled);
  const base = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    height: s.height,
    padding: s.padding,
    fontFamily: 'var(--font-sans)',
    fontSize: s.fontSize,
    fontWeight: 'var(--weight-semibold)',
    lineHeight: 1,
    borderRadius: s.radius,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background 140ms ease, box-shadow 140ms ease, transform 80ms ease',
    transform: hovered && !disabled ? 'translateY(-1px)' : 'none',
    boxShadow: variant === 'primary' && !disabled ? 'var(--shadow-xs)' : 'none',
    whiteSpace: 'nowrap',
    ...v,
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: base
  }, rest), icon && iconPosition === 'start' && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, icon), children, icon && iconPosition === 'end' && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, icon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 36,
  md: 44,
  lg: 52
};

/**
 * Square icon-only button. Always provide an aria-label.
 */
function IconButton({
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  children,
  'aria-label': ariaLabel,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const dim = SIZES[size] || SIZES.md;
  let look;
  if (variant === 'primary') {
    look = {
      background: hovered ? 'var(--color-primary-hover)' : 'var(--color-primary)',
      color: '#fff',
      border: '1px solid transparent'
    };
  } else if (variant === 'solid') {
    look = {
      background: hovered ? 'var(--surface-hover)' : 'var(--surface-card)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)'
    };
  } else {
    look = {
      background: hovered ? 'var(--surface-sunken)' : 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    };
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: 'var(--radius-md)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background 140ms ease',
      ...look,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Text input with optional label, helper/error text, and adornment.
 */
function Input({
  label,
  hint,
  error,
  icon = null,
  type = 'text',
  disabled = false,
  fullWidth = true,
  id,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error ? 'var(--color-danger)' : focused ? 'var(--color-primary)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: fullWidth ? '100%' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 46,
      padding: '0 14px',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focused ? 'var(--ring-focus)' : 'none',
      transition: 'border-color 140ms ease, box-shadow 140ms ease'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)'
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-md)',
      color: 'var(--text-primary)',
      textAlign: 'right',
      ...style
    }
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: error ? 'var(--color-danger-text)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Native select styled to match the DealEstate field system (RTL).
 */
function Select({
  label,
  hint,
  error,
  options = [],
  placeholder,
  disabled = false,
  fullWidth = true,
  id,
  value,
  onChange,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const selectId = id || React.useId();
  const borderColor = error ? 'var(--color-danger)' : focused ? 'var(--color-primary)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: fullWidth ? '100%' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: selectId,
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: 46,
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focused ? 'var(--ring-focus)' : 'none',
      transition: 'border-color 140ms ease, box-shadow 140ms ease'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selectId,
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      flex: 1,
      height: '100%',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      padding: '0 14px',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-md)',
      color: value ? 'var(--text-primary)' : 'var(--text-muted)',
      textAlign: 'right',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      insetInlineStart: 12,
      pointerEvents: 'none',
      color: 'var(--text-muted)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: error ? 'var(--color-danger-text)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * On/off switch (e.g. mark a listing as featured / published).
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  ...rest
}) {
  const switchId = id || React.useId();
  const track = {
    width: 44,
    height: 26,
    borderRadius: 'var(--radius-full)',
    background: checked ? 'var(--color-primary)' : 'var(--gray-300)',
    transition: 'background 160ms ease',
    position: 'relative',
    flex: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1
  };
  const knob = {
    position: 'absolute',
    top: 3,
    insetInlineStart: checked ? 21 : 3,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: 'var(--shadow-sm)',
    transition: 'inset-inline-start 160ms ease'
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: switchId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, /*#__PURE__*/React.createElement("button", _extends({
    id: switchId,
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      ...track,
      border: 'none',
      padding: 0
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: knob
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Fixed mobile bottom navigation. The primary nav for the DealEstate app.
 * items: [{ value, label, icon }]  — icon is a render-prop (active:boolean)=>node or a node.
 */
function BottomNav({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      position: 'absolute',
      insetInline: 0,
      bottom: 0,
      height: 'var(--bottomnav-h)',
      display: 'flex',
      alignItems: 'stretch',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-default)',
      boxShadow: '0 -2px 12px rgba(16,30,54,0.05)',
      ...style
    }
  }, rest), items.map(it => {
    const active = it.value === value;
    const iconNode = typeof it.icon === 'function' ? it.icon(active) : it.icon;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => onChange && onChange(it.value),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: active ? 'var(--color-primary)' : 'var(--text-muted)',
        fontFamily: 'var(--font-sans)',
        transition: 'color 140ms ease'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex'
      }
    }, iconNode), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-xs)',
        fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-regular)'
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Underline tab bar for switching views within a screen.
 * items: [{ value, label, count? }]
 */
function Tabs({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-5)',
      borderBottom: '1px solid var(--border-default)',
      ...style
    }
  }, rest), items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange && onChange(it.value),
      style: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '12px 2px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-md)',
        fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-regular)',
        color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
        transition: 'color 140ms ease'
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)',
        color: active ? 'var(--color-primary)' : 'var(--text-muted)',
        background: active ? 'var(--color-primary-soft)' : 'var(--surface-sunken)',
        borderRadius: 'var(--radius-full)',
        padding: '1px 7px'
      }
    }, it.count), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        insetInline: 0,
        bottom: -1,
        height: 2,
        borderRadius: 'var(--radius-full)',
        background: active ? 'var(--color-primary)' : 'transparent'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AddPropertyScreen.jsx
try { (() => {
/* Add property — multi-field registration form. Exports window.DZAddPropertyScreen. */
function DZAddPropertyScreen({
  onDone
}) {
  const {
    Input,
    Select,
    Switch,
    Button,
    IconButton,
    Badge
  } = window.DealEstateDesignSystem_89799d;
  const Icon = window.DZIcon;
  const [status, setStatus] = React.useState('available');
  const [featured, setFeatured] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1.5px dashed var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: 'var(--color-primary-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 22,
    color: "var(--color-primary)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, "\u0627\u0641\u0632\u0648\u062F\u0646 \u0639\u06A9\u0633 \u0645\u0644\u06A9"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F1\u06F2 \u062A\u0635\u0648\u06CC\u0631 \xB7 JPG \u06CC\u0627 PNG")), /*#__PURE__*/React.createElement(Input, {
    label: "\u0639\u0646\u0648\u0627\u0646 \u0645\u0644\u06A9",
    placeholder: "\u0645\u062B\u0644\u0627\u064B \u0622\u067E\u0627\u0631\u062A\u0645\u0627\u0646 \u06F9\u06F0 \u0645\u062A\u0631\u06CC \u0633\u0639\u0627\u062F\u062A\u200C\u0622\u0628\u0627\u062F"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "\u0646\u0648\u0639 \u0645\u0644\u06A9",
    placeholder: "\u0627\u0646\u062A\u062E\u0627\u0628",
    options: [{
      value: 'apartment',
      label: 'آپارتمان'
    }, {
      value: 'villa',
      label: 'ویلا'
    }, {
      value: 'shop',
      label: 'تجاری'
    }, {
      value: 'office',
      label: 'اداری'
    }]
  }), /*#__PURE__*/React.createElement(Select, {
    label: "\u0646\u0648\u0639 \u0645\u0639\u0627\u0645\u0644\u0647",
    placeholder: "\u0627\u0646\u062A\u062E\u0627\u0628",
    options: [{
      value: 'sale',
      label: 'فروش'
    }, {
      value: 'rent',
      label: 'اجاره'
    }]
  })), /*#__PURE__*/React.createElement(Select, {
    label: "\u0645\u062D\u0644\u0647",
    placeholder: "\u0627\u0646\u062A\u062E\u0627\u0628 \u0645\u062D\u0644\u0647",
    options: [{
      value: 'saadat',
      label: 'سعادت‌آباد'
    }, {
      value: 'zaferanieh',
      label: 'زعفرانیه'
    }, {
      value: 'jordan',
      label: 'جردن'
    }, {
      value: 'lavasan',
      label: 'لواسان'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "\u0645\u062A\u0631\u0627\u0698",
    placeholder: "\u06F9\u06F0"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u062E\u0648\u0627\u0628",
    placeholder: "\u06F2"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0637\u0628\u0642\u0647",
    placeholder: "\u06F3"
  })), /*#__PURE__*/React.createElement(Input, {
    label: "\u0642\u06CC\u0645\u062A (\u062A\u0648\u0645\u0627\u0646)",
    placeholder: "\u06F8\u066C\u06F5\u06F0\u06F0\u066C\u06F0\u06F0\u06F0\u066C\u06F0\u06F0\u06F0",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "banknote",
      size: 18
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 500,
      color: 'var(--text-secondary)'
    }
  }, "\u0648\u0636\u0639\u06CC\u062A"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, [{
    v: 'available',
    l: 'خالی',
    t: 'success'
  }, {
    v: 'occupied',
    l: 'پر',
    t: 'danger'
  }].map(o => {
    const on = status === o.v;
    return /*#__PURE__*/React.createElement("button", {
      key: o.v,
      onClick: () => setStatus(o.v),
      style: {
        flex: 1,
        padding: '12px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-md)',
        fontWeight: 600,
        border: `1.5px solid ${on ? o.t === 'success' ? 'var(--color-success)' : 'var(--color-danger)' : 'var(--border-default)'}`,
        background: on ? o.t === 'success' ? 'var(--color-success-soft)' : 'var(--color-danger-soft)' : 'var(--surface-card)',
        color: on ? o.t === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)' : 'var(--text-secondary)'
      }
    }, o.l);
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, "\u0645\u0644\u06A9 \u0648\u06CC\u0698\u0647"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u062F\u0631 \u0628\u0627\u0644\u0627\u06CC \u0644\u06CC\u0633\u062A \u0646\u0645\u0627\u06CC\u0634 \u062F\u0627\u062F\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F")), /*#__PURE__*/React.createElement(Switch, {
    checked: featured,
    onChange: setFeatured
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      padding: '12px var(--gutter)',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-default)',
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onDone
  }, "\u0627\u0646\u0635\u0631\u0627\u0641"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    onClick: onDone,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 20,
      color: "#fff"
    })
  }, "\u062B\u0628\u062A \u0645\u0644\u06A9")));
}
window.DZAddPropertyScreen = DZAddPropertyScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AddPropertyScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AppShell.jsx
try { (() => {
/* Shared app chrome: status bar + top app bar. Exports window.DZTopBar, window.DZStatusBar. */
function DZStatusBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-primary)',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u06F9:\u06F4\u06F1"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 5,
      alignItems: 'center',
      opacity: 0.85
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      direction: 'ltr'
    }
  }, "\u25CF\u25CF\u25CF"), /*#__PURE__*/React.createElement("span", {
    style: {
      direction: 'ltr'
    }
  }, "WiFi"), /*#__PURE__*/React.createElement("span", null, "\u06F8\u06F2\u066A")));
}
function DZTopBar({
  title,
  subtitle,
  leading,
  trailing,
  dark
}) {
  const fg = dark ? '#fff' : 'var(--text-primary)';
  const sub = dark ? 'var(--blue-200)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--header-h)',
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 var(--gutter)',
      background: dark ? 'transparent' : 'var(--surface-card)',
      borderBottom: dark ? 'none' : '1px solid var(--border-default)'
    }
  }, leading, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-lg)',
      fontWeight: 700,
      color: fg,
      lineHeight: 1.2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: sub
    }
  }, subtitle)), trailing);
}
window.DZStatusBar = DZStatusBar;
window.DZTopBar = DZTopBar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/DashboardScreen.jsx
try { (() => {
/* Dashboard — KPI overview + recent listings. Exports window.DZDashboardScreen. */
function DZDashboardScreen({
  onOpenProperty,
  onSeeAll
}) {
  const {
    StatCard,
    PropertyCard,
    Avatar,
    IconButton,
    Badge
  } = window.DealEstateDesignSystem_89799d;
  const Icon = window.DZIcon;
  const {
    agent,
    stats,
    properties
  } = window.DZ_DATA;
  const recent = properties.slice(0, 3);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      padding: 'var(--gutter)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      borderBottom: '1px solid var(--border-default)',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: agent.name
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "\u062E\u0648\u0634 \u0622\u0645\u062F\u06CC\u062F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, agent.name)), /*#__PURE__*/React.createElement(IconButton, {
    variant: "solid",
    "aria-label": "\u0627\u0639\u0644\u0627\u0646\u200C\u0647\u0627"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, stats.map(s => /*#__PURE__*/React.createElement(StatCard, {
    key: s.key,
    label: s.label,
    value: s.value,
    accent: s.accent,
    trend: s.trend,
    trendValue: s.trendValue,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: s.icon,
      size: 18
    })
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, "\u0622\u062E\u0631\u06CC\u0646 \u0627\u0645\u0644\u0627\u06A9"), /*#__PURE__*/React.createElement("button", {
    onClick: onSeeAll,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-link)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2
    }
  }, "\u0645\u0634\u0627\u0647\u062F\u0647 \u0647\u0645\u0647 ", /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-left",
    size: 16,
    color: "var(--text-link)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, recent.map(p => /*#__PURE__*/React.createElement(PropertyCard, {
    key: p.id,
    title: p.title,
    district: p.district,
    code: p.code,
    price: p.price,
    status: p.status,
    meta: [`${p.area} متر`, p.beds !== '—' ? `${p.beds} خواب` : p.type, p.deal],
    onClick: () => onOpenProperty(p)
  }))))));
}
window.DZDashboardScreen = DZDashboardScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/LoginScreen.jsx
try { (() => {
/* Login screen — agency staff sign-in. Exports window.DZLoginScreen. */
function DZLoginScreen({
  onLogin
}) {
  const {
    Button,
    Input
  } = window.DealEstateDesignSystem_89799d;
  const Icon = window.DZIcon;
  const [phone, setPhone] = React.useState('۰۹۱۲ ۳۴۵ ۶۷۸۹');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--blue-700)',
      padding: '48px 24px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      borderRadius: '0 0 var(--radius-xl) var(--radius-xl)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    alt: "",
    style: {
      width: 64,
      height: 64
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      color: '#fff'
    }
  }, "DealEstate"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--blue-200)',
      marginTop: 2
    }
  }, "\u0627\u0645\u0644\u0627\u06A9 \u0627\u06CC\u0631\u0627\u0646 \u0632\u0645\u06CC\u0646"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, "\u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: 6
    }
  }, "\u0628\u0631\u0627\u06CC \u0627\u062F\u0627\u0645\u0647 \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u062E\u0648\u062F \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F.")), /*#__PURE__*/React.createElement(Input, {
    label: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644",
    value: phone,
    onChange: e => setPhone(e.target.value),
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "phone",
      size: 18
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631",
    type: "password",
    defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "key",
      size: 18
    })
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onLogin,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "log-in",
      size: 20,
      color: "#fff"
    })
  }, "\u0648\u0631\u0648\u062F"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-link)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      padding: 4
    }
  }, "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u0627 \u0641\u0631\u0627\u0645\u0648\u0634 \u06A9\u0631\u062F\u0647\u200C\u0627\u06CC\u062F\u061F")), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      padding: '0 24px 24px'
    }
  }, "\u0646\u0633\u062E\u0647 \u06F2\u066B\u06F4 \xB7 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u06F0\u06F2\u06F1-\u06F8\u06F8\u06F8\u06F8\u06F8\u06F8\u06F8\u06F8"));
}
window.DZLoginScreen = DZLoginScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/PropertiesScreen.jsx
try { (() => {
/* Properties list — searchable, filterable by status. Exports window.DZPropertiesScreen. */
function DZPropertiesScreen({
  onOpenProperty
}) {
  const {
    PropertyCard,
    Tabs,
    Input,
    IconButton,
    Badge
  } = window.DealEstateDesignSystem_89799d;
  const Icon = window.DZIcon;
  const {
    properties
  } = window.DZ_DATA;
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const counts = {
    all: properties.length,
    available: properties.filter(p => p.status === 'available').length,
    occupied: properties.filter(p => p.status === 'occupied').length
  };
  const list = properties.filter(p => {
    const okTab = tab === 'all' || p.status === tab;
    const okQ = !q || p.title.includes(q) || p.district.includes(q) || p.code.includes(q);
    return okTab && okQ;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      padding: 'var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      borderBottom: '1px solid var(--border-default)',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "\u062C\u0633\u062A\u062C\u0648\u06CC \u0645\u0644\u06A9\u060C \u0645\u062D\u0644\u0647 \u06CC\u0627 \u06A9\u062F",
    value: q,
    onChange: e => setQ(e.target.value),
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 18
    })
  })), /*#__PURE__*/React.createElement(IconButton, {
    variant: "solid",
    "aria-label": "\u0641\u06CC\u0644\u062A\u0631",
    style: {
      height: 46,
      width: 46
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sliders",
    size: 20
  }))), /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'all',
      label: 'همه',
      count: counts.all
    }, {
      value: 'available',
      label: 'خالی',
      count: counts.available
    }, {
      value: 'occupied',
      label: 'پر',
      count: counts.occupied
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, list.length, " \u0645\u0644\u06A9 \u06CC\u0627\u0641\u062A \u0634\u062F"), list.map(p => /*#__PURE__*/React.createElement(PropertyCard, {
    key: p.id,
    title: p.title,
    district: p.district,
    code: p.code,
    price: p.price,
    status: p.status,
    meta: [`${p.area} متر`, p.beds !== '—' ? `${p.beds} خواب` : p.type, p.deal],
    onClick: () => onOpenProperty(p)
  })), list.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 0',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)'
    }
  }, "\u0645\u0644\u06A9\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u0645\u0634\u062E\u0635\u0627\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.")));
}
window.DZPropertiesScreen = DZPropertiesScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/PropertiesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/PropertyDetailScreen.jsx
try { (() => {
/* Property detail — full listing view with gallery, specs, agent CTA. Exports window.DZPropertyDetailScreen. */
function DZPropertyDetailScreen({
  property,
  onBack
}) {
  const {
    Badge,
    Button,
    IconButton,
    Avatar,
    Card
  } = window.DealEstateDesignSystem_89799d;
  const Icon = window.DZIcon;
  const {
    agent
  } = window.DZ_DATA;
  const p = property;
  const isAvail = p.status === 'available';
  const specs = [{
    icon: 'ruler',
    label: 'متراژ',
    value: `${p.area} متر`
  }, {
    icon: 'bed',
    label: 'خواب',
    value: p.beds
  }, {
    icon: 'bath',
    label: 'سرویس',
    value: p.baths
  }, {
    icon: 'building-2',
    label: 'طبقه',
    value: p.floor
  }];
  const amenities = [p.parking && {
    icon: 'car',
    label: 'پارکینگ'
  }, p.elevator && {
    icon: 'arrow-right',
    label: 'آسانسور'
  }, {
    icon: 'sun',
    label: 'نورگیر'
  }].filter(Boolean);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 220,
      flex: 'none',
      background: 'linear-gradient(135deg, var(--blue-500), var(--blue-700))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "building-2",
    size: 72,
    color: "rgba(255,255,255,0.35)",
    strokeWidth: 1.3
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      insetInline: 14,
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "\u0628\u0627\u0632\u06AF\u0634\u062A",
    onClick: onBack,
    style: {
      background: 'rgba(255,255,255,0.92)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "\u0627\u0634\u062A\u0631\u0627\u06A9",
    style: {
      background: 'rgba(255,255,255,0.92)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "share-2",
    size: 18
  })), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "\u0630\u062E\u06CC\u0631\u0647",
    style: {
      background: 'rgba(255,255,255,0.92)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    size: 18
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 14,
      insetInlineStart: 14,
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      background: 'rgba(0,0,0,0.45)',
      color: '#fff',
      padding: '4px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 14,
    color: "#fff"
  }), " \u06F1\u06F2 \u0639\u06A9\u0633")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 700,
      color: 'var(--text-primary)',
      lineHeight: 1.4
    }
  }, p.title), /*#__PURE__*/React.createElement(Badge, {
    tone: isAvail ? 'success' : 'danger',
    dot: true
  }, isAvail ? 'خالی' : 'پر')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--text-secondary)',
      fontSize: 'var(--text-sm)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 16,
    color: "var(--text-muted)"
  }), " ", p.district, " \xB7 \u06A9\u062F ", p.code), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      color: 'var(--color-primary)'
    }
  }, p.price), /*#__PURE__*/React.createElement(Badge, {
    tone: "primary",
    size: "sm"
  }, p.deal))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gap: 8
    }
  }, specs.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 6px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.icon,
    size: 20,
    color: "var(--color-primary)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, s.value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, s.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: 8
    }
  }, "\u062A\u0648\u0636\u06CC\u062D\u0627\u062A"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-base)',
      color: 'var(--text-secondary)',
      lineHeight: 'var(--leading-relaxed)'
    }
  }, p.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, amenities.map(a => /*#__PURE__*/React.createElement("span", {
    key: a.label,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-full)',
      padding: '6px 12px',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: a.icon,
    size: 15,
    color: "var(--color-success)"
  }), " ", a.label))), /*#__PURE__*/React.createElement(Card, {
    padding: "md",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: agent.name,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-md)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, agent.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, agent.role, " \xB7 ", agent.office)), /*#__PURE__*/React.createElement(IconButton, {
    variant: "primary",
    "aria-label": "\u062A\u0645\u0627\u0633"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 18,
    color: "#fff"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      padding: '12px var(--gutter)',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-default)',
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 18
    })
  }, "\u0628\u0627\u0632\u062F\u06CC\u062F"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "message-circle",
      size: 18,
      color: "#fff"
    })
  }, "\u062A\u0645\u0627\u0633 \u0628\u0627 \u0645\u0634\u0627\u0648\u0631")));
}
window.DZPropertyDetailScreen = DZPropertyDetailScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/PropertyDetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.jsx
try { (() => {
/* DealEstate UI kit — mock data (Persian real-estate listings). */
window.DZ_DATA = {
  agent: {
    name: 'رضا کریمی',
    role: 'مشاور املاک',
    office: 'دفتر سعادت‌آباد'
  },
  stats: [{
    key: 'total',
    label: 'کل املاک',
    value: '۱٬۲۴۸',
    icon: 'building-2',
    accent: 'primary'
  }, {
    key: 'available',
    label: 'خالی',
    value: '۳۱۲',
    icon: 'check-circle',
    accent: 'success',
    trend: 'up',
    trendValue: '۸٪'
  }, {
    key: 'occupied',
    label: 'پر',
    value: '۹۳۶',
    icon: 'key',
    accent: 'danger'
  }, {
    key: 'deals',
    label: 'قرارداد ماه',
    value: '۴۷',
    icon: 'trending-up',
    accent: 'accent',
    trend: 'up',
    trendValue: '۱۲٪'
  }],
  properties: [{
    id: 1,
    title: 'آپارتمان ۹۰ متری سعادت‌آباد',
    district: 'سعادت‌آباد',
    code: '۱۰۲۴',
    price: '۸٫۵ میلیارد',
    deal: 'فروش',
    type: 'آپارتمان',
    area: '۹۰',
    beds: '۲',
    baths: '۱',
    floor: '۳',
    status: 'available',
    parking: true,
    elevator: true,
    desc: 'آپارتمان نوساز با نورگیری عالی، آسانسور و پارکینگ اختصاصی در یکی از بهترین موقعیت‌های سعادت‌آباد.'
  }, {
    id: 2,
    title: 'ویلا دوبلکس لواسان',
    district: 'لواسان',
    code: '۱۰۱۹',
    price: '۳۲ میلیارد',
    deal: 'فروش',
    type: 'ویلا',
    area: '۳۲۰',
    beds: '۴',
    baths: '۳',
    floor: '—',
    status: 'available',
    parking: true,
    elevator: false,
    desc: 'ویلای دوبلکس با باغ اختصاصی، استخر سرپوشیده و چشم‌انداز کوهستان.'
  }, {
    id: 3,
    title: 'مغازه ۳۵ متری ولیعصر',
    district: 'ولیعصر',
    code: '۱۰۰۷',
    price: '۴۵ میلیون / ماه',
    deal: 'اجاره',
    type: 'تجاری',
    area: '۳۵',
    beds: '—',
    baths: '۱',
    floor: 'همکف',
    status: 'occupied',
    parking: false,
    elevator: false,
    desc: 'مغازه با موقعیت تجاری عالی روی خیابان اصلی ولیعصر، مناسب کسب‌وکار.'
  }, {
    id: 4,
    title: 'آپارتمان ۱۴۰ متری زعفرانیه',
    district: 'زعفرانیه',
    code: '۰۹۹۸',
    price: '۲۱ میلیارد',
    deal: 'فروش',
    type: 'آپارتمان',
    area: '۱۴۰',
    beds: '۳',
    baths: '۲',
    floor: '۵',
    status: 'available',
    parking: true,
    elevator: true,
    desc: 'واحد لوکس با متریال درجه‌یک، لابی مجلل و دو پارکینگ.'
  }, {
    id: 5,
    title: 'سوئیت ۴۵ متری جردن',
    district: 'جردن',
    code: '۱۰۳۱',
    price: '۳۵ میلیون / ماه',
    deal: 'اجاره',
    type: 'آپارتمان',
    area: '۴۵',
    beds: '۱',
    baths: '۱',
    floor: '۲',
    status: 'occupied',
    parking: false,
    elevator: true,
    desc: 'سوئیت جمع‌وجور و به‌روز، مناسب مجردی، نزدیک مترو.'
  }, {
    id: 6,
    title: 'دفتر کار ۸۰ متری میرداماد',
    district: 'میرداماد',
    code: '۱۰۴۰',
    price: '۹۵ میلیون / ماه',
    deal: 'اجاره',
    type: 'اداری',
    area: '۸۰',
    beds: '—',
    baths: '۲',
    floor: '۴',
    status: 'available',
    parking: true,
    elevator: true,
    desc: 'دفتر اداری با سند اداری، مناسب شرکت‌ها، دارای آبدارخانه و دو سرویس.'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/icons.jsx
try { (() => {
/* DealEstate UI kit — icon set.
 * Real Lucide (lucide.dev, ISC license) SVG path data, inlined for offline use.
 * Usage: <Icon name="building-2" size={20} />  (exported to window.DZIcon)
 */
const DZ_ICON_PATHS = {
  'home': '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/><path d="M9 21v-6h6v6"/>',
  'building-2': '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
  'plus-circle': '<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>',
  'plus': '<path d="M5 12h14M12 5v14"/>',
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'filter': '<path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/>',
  'sliders': '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  'bed': '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  'bath': '<path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.7 3 4 3.7 4 4.5V17a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-5H2"/><path d="M5 21l-1 1M20 21l1 1M7 12V5"/>',
  'ruler': '<path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2"/>',
  'banknote': '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  'phone': '<path d="M13.8 19.8a17.9 17.9 0 0 1-7.6-7.6 3 3 0 0 1 .5-3.6l1-1a1.6 1.6 0 0 1 2.3.2l1.3 1.7a1.6 1.6 0 0 1 0 2l-.6.8a13 13 0 0 0 3 3l.8-.6a1.6 1.6 0 0 1 2 0l1.7 1.3a1.6 1.6 0 0 1 .2 2.3l-1 1a3 3 0 0 1-3.6.5Z"/>',
  'message-circle': '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'arrow-right': '<path d="M5 12h14M13 5l7 7-7 7"/>',
  'arrow-left': '<path d="M19 12H5M11 5l-7 7 7 7"/>',
  'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  'heart': '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  'share-2': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'x': '<path d="M18 6 6 18M6 6l12 12"/>',
  'more-vertical': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  'key': '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  'trending-up': '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  'car': '<path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm18 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 12l2-5a2 2 0 0 1 2-1.3h10A2 2 0 0 1 19 7l2 5v5H3v-5Z"/><path d="M3 12h18"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
  'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
};
function DZIcon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  style
}) {
  const d = DZ_ICON_PATHS[name] || '';
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: {
      display: 'inline-block',
      flex: 'none',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: d
    }
  });
}
window.DZIcon = DZIcon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/icons.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.PropertyCard = __ds_scope.PropertyCard;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
