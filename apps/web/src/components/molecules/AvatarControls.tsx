import { useState, useEffect } from 'react';
import {
  avatarMeasurements,
  defaultAvatar,
  presetPose,
  poseNames,
  poseLabels,
  avatarJointNames,
  jointLabels,
  jointLimits,
  setJoint,
  measurementLimits,
  type AvatarJoint,
  type AvatarProfile,
  type AvatarMeasure,
} from '@3dmantap/shared';
import { Button, Field, Select } from '../atoms/ui';
import { MeasurementInput } from '../atoms/MeasurementInput';
const labels: Record<AvatarMeasure, string> = {
  chest: 'Lingkar dada',
  waist: 'Lingkar pinggang',
  hip: 'Lingkar pinggul',
  shoulder: 'Lebar bahu',
  arm: 'Bahu ke pergelangan tangan',
  inseam: 'Panjang kaki bagian dalam',
};
export function AvatarControls({
  profile,
  onChange,
  joint,
  onSelectJoint,
  onPreview,
  onGestureStart,
  onGestureEnd,
  onPoseModeChange,
}: {
  profile: AvatarProfile;
  onChange: (profile: AvatarProfile) => void;
  joint?: AvatarJoint | null;
  onSelectJoint?: (joint: AvatarJoint | null) => void;
  onPreview?: (profile: AvatarProfile) => void;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
  onPoseModeChange?: (enabled: boolean) => void;
}) {
  const [section, setSection] = useState<'body' | 'pose'>('body');
  useEffect(() => {
    onPoseModeChange?.(section === 'pose');
    return () => onPoseModeChange?.(false);
  }, [section, onPoseModeChange]);
  const values = avatarMeasurements(profile);
  return (
    <div className="avatar-controls">
      <div className="avatar-tabs">
        <button
          className={section === 'body' ? 'active' : ''}
          onClick={() => {
            setSection('body');
            onSelectJoint?.(null);
          }}
        >
          Ukuran tubuh
        </button>
        <button className={section === 'pose' ? 'active' : ''} onClick={() => setSection('pose')}>
          Pose
        </button>
      </div>
      {section === 'body' ? (
        <>
          <Field label="Model manusia">
            <Select
              value={profile.sex}
              onChange={(e) =>
                onChange({ ...profile, sex: e.target.value as AvatarProfile['sex'] })
              }
            >
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
            </Select>
          </Field>
          <div className="field-grid">
            <MeasurementInput
              label="Tinggi manusia (cm)"
              value={profile.height / 10}
              min={100}
              max={220}
              onCommit={(v) =>
                onChange({
                  ...profile,
                  height: Math.round(v * 10),
                  measurements: {
                    ...profile.measurements,
                    inseam: profile.measurements.inseam
                      ? Math.min(profile.measurements.inseam, Math.floor(v * 10 * 0.65))
                      : undefined,
                  },
                })
              }
            />
            <MeasurementInput
              label="Berat badan (kg)"
              value={profile.weight / 1000}
              min={25}
              max={200}
              onCommit={(v) => onChange({ ...profile, weight: Math.round(v * 1000) })}
            />
          </div>
          {(Object.keys(labels) as AvatarMeasure[]).map((k) => (
            <div key={k} className="avatar-measure">
              <MeasurementInput
                label={labels[k] + ' (cm)'}
                value={values[k] / 10}
                min={measurementLimits[k][0] / 10}
                max={
                  k === 'inseam'
                    ? Math.min(120, (profile.height / 10) * 0.65)
                    : measurementLimits[k][1] / 10
                }
                onCommit={(v) =>
                  onChange({
                    ...profile,
                    measurements: { ...profile.measurements, [k]: Math.round(v * 10) },
                  })
                }
              />
              <button
                className="avatar-auto"
                disabled={profile.measurements[k] === undefined}
                aria-label={'Otomatis ' + labels[k]}
                onClick={() =>
                  onChange({
                    ...profile,
                    measurements: { ...profile.measurements, [k]: undefined },
                  })
                }
              >
                {profile.measurements[k] === undefined ? 'Otomatis' : 'Reset'}
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() => onChange({ ...defaultAvatar(), pose: profile.pose })}
          >
            Reset tubuh
          </Button>
          <p className="help-text">
            Ukuran otomatis dikalibrasi dari model. Preview visual, ukuran dan kecocokan pakaian
            dikonfirmasi saat konsultasi.
          </p>
        </>
      ) : (
        <>
          <Field label="Preset pose">
            <Select
              value={profile.pose.preset}
              onChange={(e) =>
                onChange({
                  ...profile,
                  pose: presetPose(e.target.value as AvatarProfile['pose']['preset']),
                })
              }
            >
              {poseNames.map((p) => (
                <option key={p} value={p}>
                  {poseLabels[p]}
                </option>
              ))}
            </Select>
          </Field>
          {onSelectJoint && (
            <Field label="Sendi yang diedit">
              <Select
                value={joint ?? ''}
                onChange={(e) => onSelectJoint((e.target.value || null) as AvatarJoint | null)}
              >
                <option value="">Pilih sendi di model</option>
                {avatarJointNames.map((j) => (
                  <option key={j} value={j}>
                    {jointLabels[j]}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {joint && (
            <div className="joint-sliders">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <Field key={axis} label={'Rotasi ' + axis + ' (°)'}>
                  <div className="joint-slider">
                    <input
                      aria-label={'Geser rotasi ' + axis}
                      type="range"
                      min={-jointLimits(joint)[i]}
                      max={jointLimits(joint)[i]}
                      value={profile.pose.joints[joint]?.[i] ?? 0}
                      onPointerDown={onGestureStart}
                      onPointerUp={onGestureEnd}
                      onPointerCancel={onGestureEnd}
                      onBlur={onGestureEnd}
                      onKeyDown={onGestureStart}
                      onKeyUp={onGestureEnd}
                      onChange={(e) => {
                        const angles = [...(profile.pose.joints[joint] ?? [0, 0, 0])];
                        angles[i] = Number(e.target.value);
                        (onPreview ?? onChange)({
                          ...profile,
                          pose: setJoint(profile.pose, joint, angles),
                        });
                      }}
                    />
                    <output>{Math.round(profile.pose.joints[joint]?.[i] ?? 0)}°</output>
                  </div>
                </Field>
              ))}
            </div>
          )}
          {joint && (
            <div className="field-grid">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <MeasurementInput
                  key={axis}
                  label={'Rotasi sendi ' + axis + ' (°)'}
                  value={Math.round((profile.pose.joints[joint]?.[i] ?? 0) * 10) / 10}
                  min={-jointLimits(joint)[i]}
                  max={jointLimits(joint)[i]}
                  onCommit={(v) => {
                    const angles = [...(profile.pose.joints[joint] ?? [0, 0, 0])];
                    angles[i] = v;
                    onChange({ ...profile, pose: setJoint(profile.pose, joint, angles) });
                  }}
                />
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => onChange({ ...profile, pose: presetPose('standing') })}
          >
            Reset pose
          </Button>
          <p className="help-text">
            Klik titik sendi, lalu putar handle 3D atau gunakan slider. Memilih preset mengganti
            seluruh pose. Tinggi tetap dihitung saat berdiri.
          </p>
        </>
      )}
      <p className="avatar-private">
        Ukuran lengkap tersimpan dalam draft dan konsultasi privat. Link publik hanya menampilkan
        bentuk dan pose.
      </p>
    </div>
  );
}
