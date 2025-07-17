import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    useToast,
    FormErrorMessage,
    Select,
    Textarea,
    Heading,
    Divider,
    Text,
    Link as ChakraLink,
    InputGroup,
    InputRightElement,
    IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, AttachmentIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
    userType: Yup.string().required('User type is required'),


    department: Yup.string().required('Department is required'),
    currentYear: Yup.number()
        .nullable()
        .when('userType', {
            is: (userType) => userType === 'student',
            then: (schema) => schema
                .required('Current year is required for students')
                .min(1, 'Minimum year is 1')
                .max(4, 'Maximum year is 4'),
            otherwise: (schema) => schema.notRequired()
        }),
    graduationYear: Yup.number()
        .nullable()
        .when('userType', {
            is: (userType) => userType === 'alumni',
            then: (schema) => schema
                .required('Graduation year is required for alumni')
                .max(new Date().getFullYear(), 'Graduation year cannot be in the future'),
            otherwise: (schema) => schema.notRequired()
        }),
    currentJob: Yup.string()
        .nullable()
        .when('userType', {
            is: (userType) => userType === 'alumni',
            then: (schema) => schema.required('Current job is required for alumni'),
            otherwise: (schema) => schema.notRequired()
        }),
    bio: Yup.string().max(500, 'Bio must be less than 500 characters'),
    // verificationDocument: Yup.mixed().required('Verification document is required'),
    verificationDocument: Yup.mixed()
        .required('Verification document is required')
        .test(
            'fileType',
            'Unsupported File Format',
            value => value && ['application/pdf', 'image/jpeg', 'image/png'].includes(value.type)
        ),

});

const RegisterForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { registerStudentUser, registerAlumniUser } = useAuth();
    const toast = useToast();

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            userType: 'student',
            currentYear: '',
            graduationYear: '',
            department: '',
            currentJob: '',
            bio: '',
            verificationDocument: null,
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                setIsUploading(true);
                
                const formData = new FormData();
                
                // Common fields for all user types
                formData.append('name', values.name);
                formData.append('email', values.email);
                formData.append('password', values.password);
                formData.append('userType', values.userType);
                formData.append('department', values.department);
                
                // Conditional fields
                if (values.userType === 'student') {
                    formData.append('currentYear', values.currentYear);
                } else if (values.userType === 'alumni') {
                    formData.append('graduationYear', values.graduationYear);
                    formData.append('currentJob', values.currentJob);
                }
                
                // Bio is optional
                if (values.bio) {
                    formData.append('bio', values.bio);
                }
                
                // Append the file
                if (values.verificationDocument) {
                    formData.append('document', values.verificationDocument);
                }
                
                // Call the appropriate registration function
                if (values.userType === 'student') {
                    await registerStudentUser(formData);
                } else {
                    await registerAlumniUser(formData);
                }
                
                toast({
                    title: 'Registration successful',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            } catch (error) {
                // ... error handling ...
            } finally {
                setIsUploading(false);
            }
        }
    });

    const handleFileChange = (event) => {
        const file = event.currentTarget.files[0];
        formik.setFieldValue('verificationDocument', file);
    };

    return (
        <Box
            as="form"
            onSubmit={formik.handleSubmit}
            w="100%"
            maxW="500px"
            mx="auto"
            p={8}
            boxShadow="lg"
            borderRadius="lg"
            bg="white"
        >
            <VStack spacing={6}>
                <Heading size="lg" color="blue.600">
                    Create Account
                </Heading>
                <Divider />

                <FormControl isInvalid={formik.touched.name && formik.errors.name}>
                    <FormLabel>Name</FormLabel>
                    <Input
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter your name"
                    />
                    <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={formik.touched.email && formik.errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                        type="email"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter your email"
                    />
                    <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={formik.touched.password && formik.errors.password}>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Enter your password"
                        />
                        <InputRightElement>
                            <IconButton
                                variant="ghost"
                                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{formik.errors.password}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={formik.touched.userType && formik.errors.userType}>
                    <FormLabel>User Type</FormLabel>
                    <Select
                        name="userType"
                        value={formik.values.userType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    >
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                    </Select>
                    <FormErrorMessage>{formik.errors.userType}</FormErrorMessage>
                </FormControl>

                {formik.values.userType === 'student' ? (
                    <FormControl isInvalid={formik.touched.currentYear && formik.errors.currentYear}>
                        <FormLabel>Current Year</FormLabel>
                        <Input
                            type="number"
                            name="currentYear"
                            value={formik.values.currentYear}
                            onChange={(e) => formik.setFieldValue('currentYear', parseInt(e.target.value) || '')}
                            onBlur={formik.handleBlur}
                            placeholder="Enter your current year (1-4)"
                        />
                        <FormErrorMessage>{formik.errors.currentYear}</FormErrorMessage>
                    </FormControl>
                ) : (
                    <FormControl isInvalid={formik.touched.graduationYear && formik.errors.graduationYear}>
                        <FormLabel>Graduation Year</FormLabel>
                        <Input
                            type="number"
                            name="graduationYear"
                            value={formik.values.graduationYear}
                            onChange={(e) => formik.setFieldValue('graduationYear', parseInt(e.target.value) || '')}
                            onBlur={formik.handleBlur}
                            placeholder="Enter your graduation year"
                        />
                        <FormErrorMessage>{formik.errors.graduationYear}</FormErrorMessage>
                    </FormControl>
                )}

                <FormControl isInvalid={formik.touched.department && formik.errors.department}>
                    <FormLabel>Department</FormLabel>
                    <Input
                        name="department"
                        value={formik.values.department}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter your department"
                    />
                    <FormErrorMessage>{formik.errors.department}</FormErrorMessage>
                </FormControl>

                {formik.values.userType === 'alumni' && (
                    <FormControl isInvalid={formik.touched.currentJob && formik.errors.currentJob}>
                        <FormLabel>Current Job</FormLabel>
                        <Input
                            name="currentJob"
                            value={formik.values.currentJob}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Enter your current job"
                        />
                        <FormErrorMessage>{formik.errors.currentJob}</FormErrorMessage>
                    </FormControl>
                )}

                <FormControl isInvalid={formik.touched.bio && formik.errors.bio}>
                    <FormLabel>Bio</FormLabel>
                    <Textarea
                        name="bio"
                        value={formik.values.bio}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Tell us about yourself"
                        rows={4}
                    />
                    <FormErrorMessage>{formik.errors.bio}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={formik.touched.verificationDocument && formik.errors.verificationDocument}>
                    <FormLabel>Verification Document</FormLabel>
                    <Input
                        type="file"
                        name="verificationDocument"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        display="none"
                        id="verification-document"
                    />
                    <Button
                        as="label"
                        htmlFor="verification-document"
                        leftIcon={<AttachmentIcon />}
                        colorScheme="blue"
                        variant="outline"
                        w="100%"
                        cursor="pointer"
                    >
                        {formik.values.verificationDocument
                            ? formik.values.verificationDocument.name
                            : 'Upload Verification Document'}
                    </Button>
                    <FormErrorMessage>{formik.errors.verificationDocument}</FormErrorMessage>
                </FormControl>

                <Button
                    type="submit"
                    colorScheme="blue"
                    w="100%"
                    size="lg"
                    isLoading={formik.isSubmitting || isUploading}
                >
                    Register
                </Button>

                <Text>
                    Already have an account?{' '}
                    <ChakraLink as={Link} to="/login" color="blue.500">
                        Login here
                    </ChakraLink>
                </Text>
            </VStack>
        </Box>
    );
};

export default RegisterForm; 