import { Box, Button, Card, Dialog, Flex, Grid, Heading, Inset, Spinner, Strong, Switch, Text } from '@radix-ui/themes';
import React, { useEffect, useRef, useState } from 'react';
import type { FlagData } from '../types/types';
import { countryData } from '../utils/Constants';
import { createImageURL, fetchFlagData, saveBlobToDisk } from '../utils/utils';

const Flag: React.FC = () => {
  const [flags, setFlags] = useState<FlagData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSvgMode, setIsSvgMode] = useState(false);
  const [toastInfo, setToastInfo] = useState<{ visible: boolean; name: string }>({
    visible: false,
    name: '',
  });

  // Use a ref to track URLs for cleanup to prevent memory leaks
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const currentUrls = objectUrlsRef.current;

    const loadAllFlags = async () => {
      setIsLoading(true);

      const promises = countryData.map((country) =>
        fetchFlagData(country.code, country.name)
          .then((data) => {
            const url = URL.createObjectURL(data.blob);
            currentUrls.push(url); // Use the local variable
            return { ...data, objectURL: url };
          })
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      const successfulFlags = results.filter((f): f is FlagData => f !== null);

      setFlags(successfulFlags);
      setIsLoading(false);
    };

    loadAllFlags();

    return () => {
      currentUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    for (const flag of flags) {
      await saveBlobToDisk(flag);
    }
    setIsSaving(false);
  };

  const showToast = (name: string) => {
    setToastInfo({ visible: true, name });
    setTimeout(() => setToastInfo({ visible: false, name: '' }), 3000); // Hide after 3s
  };

  return (
    <Box p="4">
      <Flex
        justify="between"
        align="center"
        mb="6"
        p="4"
        m="-4"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--color-background)',
          borderBottom: '1px solid var(--gray-5)',
        }}
      >
        <Box>
          <Heading size="8" mb="2">
            World Flags
          </Heading>
          <Text color="gray" size="2">
            {isLoading ? 'Fetching flags...' : `Loaded ${flags.length} flags successfully`}
          </Text>
        </Box>

        <Button size="3" variant="soft" onClick={handleSaveAll} disabled={isLoading || isSaving || flags.length === 0}>
          {isSaving ? <Spinner /> : null}
          {isSaving ? 'Saving...' : 'Save All Flags'}
        </Button>
      </Flex>

      {isLoading ? (
        <Flex align="center" justify="center" height="50vh">
          <Spinner size="3" />
        </Flex>
      ) : (
        <Grid columns={{ initial: '2', sm: '3', md: '4', lg: '6' }} gap="4">
          {flags.map((flag) => (
            <Dialog.Root key={flag.countryCode}>
              <Dialog.Trigger>
                <Card size="2" className="flag-card" style={{ cursor: 'pointer' }}>
                  <Inset clip="padding-box" side="top" style={{ overflow: 'hidden' }}>
                    <img
                      src={flag.objectURL}
                      alt={`Flag of ${flag.countryName}`}
                      className="flag-img"
                      style={{
                        display: 'block',
                        objectFit: 'cover',
                        width: '100%',
                        height: 120,
                        backgroundColor: 'var(--gray-5)',
                      }}
                    />
                  </Inset>
                  <Text as="p" size="2" align="center" mt="3">
                    <Strong>{flag.countryName}</Strong>
                  </Text>
                </Card>
              </Dialog.Trigger>
              <Dialog.Content maxWidth="600px">
                <Dialog.Title size="5" mb="4">
                  {flag.countryName}
                </Dialog.Title>

                <Box
                  mb="4"
                  style={{
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-3)',
                    backgroundColor: 'var(--gray-5)',
                    border: '1px solid var(--gray-6)',
                  }}
                >
                  <img
                    src={flag.objectURL}
                    alt={flag.countryName}
                    style={{
                      display: 'block',
                      objectFit: 'contain',
                      width: '100%',
                      maxHeight: '60vh',
                    }}
                  />
                </Box>

                <Flex gap="3" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">
                      Close
                    </Button>
                  </Dialog.Close>

                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (isSvgMode) {
                          // SVG Vector Mode: Fetch code and copy as text
                          const svgUrl = createImageURL(flag.countryCode, 'svg');
                          const response = await fetch(svgUrl);
                          const svgText = await response.text();
                          await navigator.clipboard.writeText(svgText);
                          showToast(`SVG Vector Code Copied!`);
                        } else {
                          // PNG Mode: Standard blob copy
                          const item = new ClipboardItem({ [flag.blob.type]: flag.blob });
                          await navigator.clipboard.write([item]);
                          showToast(`PNG Image Copied!`);
                        }
                      } catch (err) {
                        console.error('Copy failed:', err);
                      }
                    }}
                  >
                    Copy {isSvgMode ? 'SVG' : 'Image'}
                  </Button>

                  <Button onClick={() => saveBlobToDisk(flag)}>Download Flag</Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          ))}
        </Grid>
      )}
      {/* Sticky Bottom Toggle */}
      <Flex
        p="3"
        gap="3"
        align="center"
        justify="center"
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--gray-a3)',
          backdropFilter: 'blur(12px)',
          borderRadius: '999px',
          border: '1px solid var(--gray-a5)',
          boxShadow: 'var(--shadow-5)',
          zIndex: 100,
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <Text size="2" weight={!isSvgMode ? 'bold' : 'regular'} color={!isSvgMode ? 'green' : 'gray'}>
          PNG
        </Text>

        <Switch size="2" checked={isSvgMode} onCheckedChange={setIsSvgMode} />

        <Text size="2" weight={isSvgMode ? 'bold' : 'regular'} color={isSvgMode ? 'green' : 'gray'}>
          SVG
        </Text>
      </Flex>
      {/* Floating Toast Notification */}
      {toastInfo.visible && (
        <Box
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <Card size="1" variant="ghost" style={{ backgroundColor: 'var(--gray-12)', color: 'var(--gray-1)' }}>
            <Flex gap="3" align="center" px="2">
              <Box style={{ backgroundColor: 'var(--green-9)', borderRadius: '50%', width: 8, height: 8 }} />
              <Text size="2" weight="bold">
                Copied {toastInfo.name} to clipboard
              </Text>
            </Flex>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Flag;
